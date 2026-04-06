import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitHubAdapter } from '../src/services/github-adapter';
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
    'todoToIssue.github.token': 'ghp_test_token_123',
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

describe('GitHubAdapter', () => {
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
        json: async () => ({
          number: 42,
          html_url: 'https://github.com/test-owner/test-repo/issues/42',
        }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new GitHubAdapter(secretStorage as any);
      const ctx = createMockContext();

      const result = await adapter.createIssue(ctx, '[TODO] Refactor authentication middleware');

      expect(result.provider).toBe('github');
      expect(result.key).toBe('#42');
      expect(result.url).toBe('https://github.com/test-owner/test-repo/issues/42');
      expect(result.title).toBe('[TODO] Refactor authentication middleware');
    });

    it('should include labels in request body', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ number: 1, html_url: 'https://github.com/test/repo/issues/1' }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new GitHubAdapter(secretStorage as any);
      await adapter.createIssue(createMockContext());

      const [, options] = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.labels).toContain('enhancement');
    });

    it('should throw error when token is missing', async () => {
      const secretStorage = createMockSecretStorage();
      secretStorage.get = vi.fn(async () => undefined);

      const adapter = new GitHubAdapter(secretStorage as any);

      await expect(adapter.createIssue(createMockContext())).rejects.toThrow(
        'GitHub token not configured',
      );
    });

    it('should throw error on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        text: async () => 'Validation Failed',
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new GitHubAdapter(secretStorage as any);

      await expect(adapter.createIssue(createMockContext())).rejects.toThrow(
        'GitHub API error (422)',
      );
    });

    it('should use Bearer token authorization', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ number: 1, html_url: '' }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new GitHubAdapter(secretStorage as any);
      await adapter.createIssue(createMockContext());

      const [, options] = (global.fetch as any).mock.calls[0];
      expect(options.headers.Authorization).toBe('Bearer ghp_test_token_123');
    });

    it('should send to correct repo URL', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ number: 1, html_url: '' }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new GitHubAdapter(secretStorage as any);
      await adapter.createIssue(createMockContext());

      const [url] = (global.fetch as any).mock.calls[0];
      expect(url).toContain('/repos/test-owner/test-repo/issues');
    });

    it('should use BUG type label', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ number: 1, html_url: '' }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new GitHubAdapter(secretStorage as any);
      await adapter.createIssue(createMockContext({ todoType: 'BUG' }));

      const [, options] = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.labels).toContain('bug');
    });
  });

  describe('searchDuplicates', () => {
    it('should search GitHub issues', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          items: [
            {
              number: 10,
              html_url: 'https://github.com/test/repo/issues/10',
              title: 'Fix authentication',
            },
          ],
        }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new GitHubAdapter(secretStorage as any);

      const results = await adapter.searchDuplicates('Fix authentication', 'src/auth.ts');
      expect(results.length).toBe(1);
      expect(results[0].key).toBe('#10');
      expect(results[0].provider).toBe('github');
    });

    it('should handle empty search results', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new GitHubAdapter(secretStorage as any);

      const results = await adapter.searchDuplicates('nonexistent', 'src/none.ts');
      expect(results.length).toBe(0);
    });
  });

  describe('getIssueStatus', () => {
    it('should return issue state', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ state: 'open' }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new GitHubAdapter(secretStorage as any);

      const status = await adapter.getIssueStatus('#42');
      expect(status).toBe('open');
    });

    it('should handle closed issues', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ state: 'closed' }),
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new GitHubAdapter(secretStorage as any);

      const status = await adapter.getIssueStatus('#42');
      expect(status).toBe('closed');
    });

    it('should handle API error for status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      });

      const secretStorage = createMockSecretStorage();
      const adapter = new GitHubAdapter(secretStorage as any);

      await expect(adapter.getIssueStatus('#999')).rejects.toThrow('GitHub API error (404)');
    });
  });
});
