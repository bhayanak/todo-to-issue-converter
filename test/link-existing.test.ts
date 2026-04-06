import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';

vi.mock('../src/services/context-extractor', () => ({
  extractContext: vi.fn(),
}));

vi.mock('../src/utils/git-utils', () => ({
  getGitBlame: vi.fn(() => null),
  getGitBranch: vi.fn(() => 'main'),
  getGitRemoteUrl: vi.fn(() => null),
  getGitCommitSha: vi.fn(() => null),
  buildCodePermalink: vi.fn(() => null),
}));

import { linkExistingCommand } from '../src/commands/link-existing';
import { extractContext } from '../src/services/context-extractor';

const mockExtractContext = vi.mocked(extractContext);

describe('link-existing command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (vscode.window as any).activeTextEditor = {
      document: {
        uri: { fsPath: '/workspace/src/test.ts' },
        lineAt: (i: number) => ({ text: '// TODO: Fix something' }),
        lineCount: 10,
        languageId: 'typescript',
      },
      selection: { active: { line: 0 } },
    };
  });

  it('should show warning when no editor is active', async () => {
    (vscode.window as any).activeTextEditor = undefined;
    const spy = vi.spyOn(vscode.window, 'showWarningMessage');

    await linkExistingCommand();
    expect(spy).toHaveBeenCalledWith('No active editor found.');
  });

  it('should show warning when no TODO found', async () => {
    mockExtractContext.mockReturnValue(null);
    const spy = vi.spyOn(vscode.window, 'showWarningMessage');

    await linkExistingCommand();
    expect(spy).toHaveBeenCalledWith('No TODO/FIXME/HACK/BUG comment found on the current line.');
  });

  it('should ask for issue key and link', async () => {
    mockExtractContext.mockReturnValue({
      filePath: 'src/test.ts',
      absolutePath: '/workspace/src/test.ts',
      lineNumber: 5,
      todoType: 'TODO',
      todoText: 'fix this',
      language: 'typescript',
      surroundingCode: '',
      gitBlame: null,
      gitBranch: null,
      repoUrl: null,
      codePermalink: null,
    });

    vi.spyOn(vscode.window, 'showInputBox').mockResolvedValue('PROJ-123');
    const spy = vi.spyOn(vscode.window, 'showInformationMessage');

    await linkExistingCommand();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('PROJ-123'));
  });

  it('should do nothing when user cancels input', async () => {
    mockExtractContext.mockReturnValue({
      filePath: 'src/test.ts',
      absolutePath: '/workspace/src/test.ts',
      lineNumber: 5,
      todoType: 'TODO',
      todoText: 'fix this',
      language: 'typescript',
      surroundingCode: '',
      gitBlame: null,
      gitBranch: null,
      repoUrl: null,
      codePermalink: null,
    });

    vi.spyOn(vscode.window, 'showInputBox').mockResolvedValue(undefined);
    const spy = vi.spyOn(vscode.window, 'showInformationMessage');

    await linkExistingCommand();
    expect(spy).not.toHaveBeenCalled();
  });
});
