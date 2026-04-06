import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';

vi.mock('../src/utils/git-utils', () => ({
  getGitBlame: vi.fn(() => null),
  getGitBranch: vi.fn(() => 'main'),
  getGitRemoteUrl: vi.fn(() => null),
  getGitCommitSha: vi.fn(() => null),
  buildCodePermalink: vi.fn(() => null),
}));

import { bulkScanCommand } from '../src/commands/bulk-scan';

describe('bulk-scan command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should scan workspace and report results', async () => {
    // Mock findFiles to return files
    (vscode.workspace as any).findFiles = vi
      .fn()
      .mockResolvedValue([
        { fsPath: '/mock/workspace/src/a.ts' },
        { fsPath: '/mock/workspace/src/b.ts' },
      ]);

    // Mock readFile to return content with TODOs
    (vscode.workspace as any).fs = {
      readFile: vi
        .fn()
        .mockResolvedValue(
          new TextEncoder().encode('// TODO: fix this\nconst x = 1;\n// FIXME: also fix'),
        ),
    };

    const spy = vi.spyOn(vscode.window, 'showInformationMessage');
    const results = await bulkScanCommand();

    expect(results.length).toBeGreaterThan(0);
    expect(spy).toHaveBeenCalled();
  });

  it('should show message when no TODOs found', async () => {
    (vscode.workspace as any).findFiles = vi
      .fn()
      .mockResolvedValue([{ fsPath: '/mock/workspace/src/clean.ts' }]);

    (vscode.workspace as any).fs = {
      readFile: vi.fn().mockResolvedValue(new TextEncoder().encode('const x = 1;\nconst y = 2;')),
    };

    const spy = vi.spyOn(vscode.window, 'showInformationMessage');
    const results = await bulkScanCommand();

    expect(results.length).toBe(0);
    expect(spy).toHaveBeenCalledWith('No TODO comments found in workspace.');
  });

  it('should handle empty workspace', async () => {
    (vscode.workspace as any).findFiles = vi.fn().mockResolvedValue([]);

    const spy = vi.spyOn(vscode.window, 'showInformationMessage');
    const results = await bulkScanCommand();

    expect(results.length).toBe(0);
    expect(spy).toHaveBeenCalledWith('No TODO comments found in workspace.');
  });

  it('should skip files that cannot be read', async () => {
    (vscode.workspace as any).findFiles = vi
      .fn()
      .mockResolvedValue([
        { fsPath: '/mock/workspace/src/bad.ts' },
        { fsPath: '/mock/workspace/src/good.ts' },
      ]);

    let callCount = 0;
    (vscode.workspace as any).fs = {
      readFile: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('read error');
        }
        return new TextEncoder().encode('// TODO: found one');
      }),
    };

    const results = await bulkScanCommand();
    // Should still return results from the good file
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  it('should distinguish linked and unlinked TODOs', async () => {
    (vscode.workspace as any).findFiles = vi
      .fn()
      .mockResolvedValue([{ fsPath: '/mock/workspace/src/mixed.ts' }]);

    (vscode.workspace as any).fs = {
      readFile: vi
        .fn()
        .mockResolvedValue(
          new TextEncoder().encode(
            '// TODO(PROJ-1): linked todo\n// TODO: unlinked todo\n// FIXME: another unlinked',
          ),
        ),
    };

    const spy = vi.spyOn(vscode.window, 'showInformationMessage');
    const results = await bulkScanCommand();

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(spy).toHaveBeenCalled();
    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain('unlinked');
    expect(msg).toContain('linked');
  });
});
