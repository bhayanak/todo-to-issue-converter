import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JiraAdapter } from '../src/services/jira-adapter';
import { TodoContext } from '../src/models/todo-item';

function createMockContext(overrides: Partial<TodoContext> = {}): TodoContext {
  return {
    filePath: 'src/services/auth.ts',
    absolutePath: '/workspace/src/services/auth.ts',
    lineNumber: 42,
    todoType: 'TODO',
    todoText: 'Refactor authentication middleware',
    language: 'typescript',
    surroundingCode: '// TODO: Refactor authentication middleware',
    gitBlame: {
      author: 'Jane Doe',
      email: 'jane@example.com',
      date: '2024-01-15T10:30:00.000Z',
      commit: 'abc123',
    },
    gitBranch: 'main',
    repoUrl: 'https://github.com/test/repo',
    codePermalink: 'https://github.com/test/repo/blob/abc123/src/services/auth.ts#L42',
    ...overrides,
  };
}

function createMockSecretStorage(secrets: Record<string, string> = {}) {
  const store: Record<string, string> = {
    'todoToIssue.jira.email': 'test@example.com',
    'todoToIssue.jira.apiToken': 'test-token-123',
    ...secrets,
  };

  return {
    get: vi.fn(async (key: string) => store[key] || undefined),
    store: vi.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    delete: vi.fn(async () => {}),
    onDidChange: vi.fn(),
  };
}

describe('JiraAdapter', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('createIssue', () => {
    it('should create an issue successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ key: 'TEST-123' }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new JiraAdapter(secretStorage as any);
      const ctx = createMockContext();

      const result = await adapter.createIssue(ctx, '[TODO] Refactor authentication middleware');

      expect(result.provider).toBe('jira');
      expect(result.key).toBe('TEST-123');
      expect(result.url).toContain('TEST-123');
      expect(result.title).toBe('[TODO] Refactor authentication middleware');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (global.fetch as any).mock.calls[0];
      expect(url).toContain('/rest/api/3/issue');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body);
      expect(body.fields.project.key).toBe('TEST');
      expect(body.fields.summary).toBe('[TODO] Refactor authentication middleware');
      expect(body.fields.labels).toContain('enhancement');
    });

    it('should throw error when credentials are missing', async () => {
      const secretStorage = createMockSecretStorage({
        'todoToIssue.jira.email': '',
        'todoToIssue.jira.apiToken': '',
      });
      // Override get to return undefined
      secretStorage.get = vi.fn(async () => undefined);

      const adapter = new JiraAdapter(secretStorage as any);
      const ctx = createMockContext();

      await expect(adapter.createIssue(ctx)).rejects.toThrow('Jira credentials not configured');
    });

    it('should throw error on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new JiraAdapter(secretStorage as any);
      const ctx = createMockContext();

      await expect(adapter.createIssue(ctx)).rejects.toThrow('Jira API error (400)');
    });

    it('should use correct auth header format', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ key: 'TEST-1' }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new JiraAdapter(secretStorage as any);
      await adapter.createIssue(createMockContext());

      const [, options] = (global.fetch as any).mock.calls[0];
      const authHeader = options.headers.Authorization;
      expect(authHeader).toMatch(/^Basic /);
      const decoded = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString();
      expect(decoded).toBe('test@example.com:test-token-123');
    });
  });

  describe('searchDuplicates', () => {
    it('should search for duplicates via JQL', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          issues: [
            { key: 'TEST-50', fields: { summary: 'Fix auth issue' } },
            { key: 'TEST-51', fields: { summary: 'Refactor auth' } },
          ],
        }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new JiraAdapter(secretStorage as any);

      const results = await adapter.searchDuplicates('Fix authentication', 'src/auth.ts');
      expect(results.length).toBe(2);
      expect(results[0].key).toBe('TEST-50');
      expect(results[0].provider).toBe('jira');
      expect(results[1].key).toBe('TEST-51');
    });

    it('should handle empty search results', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ issues: [] }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new JiraAdapter(secretStorage as any);

      const results = await adapter.searchDuplicates('nonexistent', 'src/none.ts');
      expect(results.length).toBe(0);
    });
  });

  describe('getIssueStatus', () => {
    it('should return issue status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          fields: { status: { name: 'In Progress' } },
        }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new JiraAdapter(secretStorage as any);

      const status = await adapter.getIssueStatus('TEST-123');
      expect(status).toBe('In Progress');
    });

    it('should handle API error for status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new JiraAdapter(secretStorage as any);

      await expect(adapter.getIssueStatus('TEST-999')).rejects.toThrow('Jira API error (404)');
    });
  });
});
