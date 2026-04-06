import { describe, it, expect, vi } from 'vitest';
import { extractContext } from '../src/services/context-extractor';

vi.mock('../src/utils/git-utils', () => ({
  getGitBlame: vi.fn(() => ({
    author: 'Test Author',
    email: 'test@test.com',
    date: '2024-01-01T00:00:00.000Z',
    commit: 'abc123',
  })),
  getGitBranch: vi.fn(() => 'main'),
  getGitRemoteUrl: vi.fn(() => 'https://github.com/test/repo'),
  getGitCommitSha: vi.fn(() => 'abc123def456'),
  buildCodePermalink: vi.fn(() => 'https://github.com/test/repo/blob/abc123def456/src/test.ts#L5'),
}));

function createMockEditor(lines: string[], activeLine: number) {
  return {
    document: {
      lineAt: (i: number) => ({
        text: lines[i],
      }),
      lineCount: lines.length,
      uri: { fsPath: '/mock/workspace/src/test.ts' },
      languageId: 'typescript',
    },
    selection: {
      active: {
        line: activeLine,
      },
    },
  };
}

describe('extractContext', () => {
  it('should extract context from a TODO line', () => {
    const editor = createMockEditor(
      [
        'const a = 1;',
        'const b = 2;',
        'const c = 3;',
        'const d = 4;',
        '// TODO: fix the auth flow',
        'const e = 5;',
        'const f = 6;',
        'const g = 7;',
        'const h = 8;',
        'const i = 9;',
      ],
      4, // Line with TODO
    );

    const ctx = extractContext(editor as any);

    expect(ctx).not.toBeNull();
    expect(ctx!.todoType).toBe('TODO');
    expect(ctx!.todoText).toBe('fix the auth flow');
    expect(ctx!.lineNumber).toBe(5); // 1-based
    expect(ctx!.language).toBe('typescript');
    expect(ctx!.surroundingCode).toContain('const a = 1;');
    expect(ctx!.surroundingCode).toContain('// TODO: fix the auth flow');
  });

  it('should return null for non-TODO lines', () => {
    const editor = createMockEditor(['const x = 42;'], 0);
    const ctx = extractContext(editor as any);
    expect(ctx).toBeNull();
  });

  it('should extract FIXME context', () => {
    const editor = createMockEditor(['// FIXME: broken validation'], 0);
    const ctx = extractContext(editor as any);
    expect(ctx).not.toBeNull();
    expect(ctx!.todoType).toBe('FIXME');
  });

  it('should extract HACK context', () => {
    const editor = createMockEditor(['// HACK: temporary workaround'], 0);
    const ctx = extractContext(editor as any);
    expect(ctx).not.toBeNull();
    expect(ctx!.todoType).toBe('HACK');
  });

  it('should extract BUG context', () => {
    const editor = createMockEditor(['// BUG: fails on empty input'], 0);
    const ctx = extractContext(editor as any);
    expect(ctx).not.toBeNull();
    expect(ctx!.todoType).toBe('BUG');
  });

  it('should use provided lineNumber instead of selection', () => {
    const editor = createMockEditor(
      ['const x = 1;', '// TODO: first', '// FIXME: second'],
      0, // Selection is on line 0
    );

    const ctx = extractContext(editor as any, 2); // But we specify line 2
    expect(ctx).not.toBeNull();
    expect(ctx!.todoType).toBe('FIXME');
  });

  it('should include git blame info', () => {
    const editor = createMockEditor(['// TODO: test blame'], 0);
    const ctx = extractContext(editor as any);
    expect(ctx).not.toBeNull();
    expect(ctx!.gitBlame).not.toBeNull();
    expect(ctx!.gitBlame!.author).toBe('Test Author');
  });

  it('should include git branch', () => {
    const editor = createMockEditor(['// TODO: test branch'], 0);
    const ctx = extractContext(editor as any);
    expect(ctx!.gitBranch).toBe('main');
  });

  it('should include repo URL', () => {
    const editor = createMockEditor(['// TODO: test url'], 0);
    const ctx = extractContext(editor as any);
    expect(ctx!.repoUrl).toBe('https://github.com/test/repo');
  });

  it('should include code permalink', () => {
    const editor = createMockEditor(['// TODO: test permalink'], 0);
    const ctx = extractContext(editor as any);
    expect(ctx!.codePermalink).toContain('github.com');
  });

  it('should handle surrounding code at document start', () => {
    const editor = createMockEditor(['// TODO: at start', 'line2'], 0);
    const ctx = extractContext(editor as any);
    expect(ctx!.surroundingCode).toContain('// TODO: at start');
    expect(ctx!.surroundingCode).toContain('line2');
  });

  it('should handle surrounding code at document end', () => {
    const editor = createMockEditor(['line1', '// TODO: at end'], 1);
    const ctx = extractContext(editor as any);
    expect(ctx!.surroundingCode).toContain('line1');
    expect(ctx!.surroundingCode).toContain('// TODO: at end');
  });
});
