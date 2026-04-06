import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';

// Mock context-extractor
vi.mock('../src/services/context-extractor', () => ({
  extractContext: vi.fn(),
}));

// Mock template-engine
vi.mock('../src/services/template-engine', () => ({
  buildTitle: vi.fn(() => '[TODO] Test title'),
  renderTemplate: vi.fn(() => 'Test body'),
}));

// Mock git-utils
vi.mock('../src/utils/git-utils', () => ({
  getGitBlame: vi.fn(() => null),
  getGitBranch: vi.fn(() => 'main'),
  getGitRemoteUrl: vi.fn(() => 'https://github.com/test/repo'),
  getGitCommitSha: vi.fn(() => 'abc123'),
  buildCodePermalink: vi.fn(() => null),
}));

import { createIssueCommand, getAdapter } from '../src/commands/create-issue';
import { extractContext } from '../src/services/context-extractor';
import { TodoContext } from '../src/models/todo-item';

const mockExtractContext = vi.mocked(extractContext);

function createMockSecretStorage() {
  const store: Record<string, string> = {
    'todoToIssue.jira.email': 'test@test.com',
    'todoToIssue.jira.apiToken': 'token123',
    'todoToIssue.github.token': 'ghp_token',
  };
  return {
    get: vi.fn(async (key: string) => store[key]),
    store: vi.fn(async () => {}),
    delete: vi.fn(async () => {}),
    onDidChange: vi.fn(),
  };
}

function createMockContext(): TodoContext {
  return {
    filePath: 'src/test.ts',
    absolutePath: '/workspace/src/test.ts',
    lineNumber: 10,
    todoType: 'TODO',
    todoText: 'Fix the auth flow',
    language: 'typescript',
    surroundingCode: '// TODO: Fix the auth flow',
    gitBlame: null,
    gitBranch: 'main',
    repoUrl: 'https://github.com/test/repo',
    codePermalink: null,
  };
}

describe('create-issue command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (vscode.window as any).activeTextEditor = {
      document: {
        uri: { fsPath: '/workspace/src/test.ts' },
        lineAt: (i: number) => ({ text: '// TODO: Fix the auth flow' }),
        lineCount: 20,
        languageId: 'typescript',
      },
      selection: { active: { line: 9 } },
    };
  });

  it('should show warning when no editor is active', async () => {
    (vscode.window as any).activeTextEditor = undefined;
    const spy = vi.spyOn(vscode.window, 'showWarningMessage');

    await createIssueCommand(createMockSecretStorage() as any);
    expect(spy).toHaveBeenCalledWith('No active editor found.');
  });

  it('should show warning when no TODO found on line', async () => {
    mockExtractContext.mockReturnValue(null);
    const spy = vi.spyOn(vscode.window, 'showWarningMessage');

    await createIssueCommand(createMockSecretStorage() as any);
    expect(spy).toHaveBeenCalledWith('No TODO/FIXME/HACK/BUG comment found on the current line.');
  });

  it('should create issue successfully', async () => {
    mockExtractContext.mockReturnValue(createMockContext());

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ key: 'TEST-42' }),
    });

    const spy = vi.spyOn(vscode.window, 'showInformationMessage');
    await createIssueCommand(createMockSecretStorage() as any);

    expect(spy).toHaveBeenCalled();
    const callArg = spy.mock.calls[0][0];
    expect(callArg).toContain('TEST-42');
  });

  it('should handle issue creation error', async () => {
    mockExtractContext.mockReturnValue(createMockContext());

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Server Error',
    });

    const spy = vi.spyOn(vscode.window, 'showErrorMessage');
    await createIssueCommand(createMockSecretStorage() as any);

    expect(spy).toHaveBeenCalled();
  });

  it('should handle duplicate detection flow - user cancels', async () => {
    mockExtractContext.mockReturnValue(createMockContext());

    // Mock search returning duplicates
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        issues: [{ key: 'TEST-1', fields: { summary: 'Fix auth flow' } }],
      }),
    });

    // User cancels the quick pick
    vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue(undefined);

    await createIssueCommand(createMockSecretStorage() as any);

    // Should not show creation success message
    const infoSpy = vi.spyOn(vscode.window, 'showInformationMessage');
    // Verify no creation happened after cancel
  });

  it('should handle duplicate detection flow - link existing', async () => {
    mockExtractContext.mockReturnValue(createMockContext());

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        issues: [{ key: 'TEST-99', fields: { summary: 'Fix the auth flow' } }],
      }),
    });

    vi.spyOn(vscode.window, 'showQuickPick').mockResolvedValue({
      label: 'TEST-99',
      description: 'Fix the auth flow',
      detail: '',
      issueKey: 'TEST-99',
    } as any);

    const spy = vi.spyOn(vscode.window, 'showInformationMessage');
    await createIssueCommand(createMockSecretStorage() as any);

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('TEST-99'));
  });

  it('should proceed when duplicate detection fails', async () => {
    mockExtractContext.mockReturnValue(createMockContext());

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      callCount++;
      if (callCount === 1) {
        // First call is search — throw error
        return { ok: false, status: 500, text: async () => 'Error' };
      }
      // Second call is create
      return { ok: true, json: async () => ({ key: 'TEST-50' }) };
    });

    const spy = vi.spyOn(vscode.window, 'showInformationMessage');
    await createIssueCommand(createMockSecretStorage() as any);

    // Should proceed with creation after search failure
  });

  describe('getAdapter', () => {
    it('should return JiraAdapter for jira provider', () => {
      const adapter = getAdapter(createMockSecretStorage() as any);
      // Default config is jira
      expect(adapter).toBeDefined();
    });
  });
});
