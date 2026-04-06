import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';

vi.mock('../src/utils/git-utils', () => ({
  getGitBlame: vi.fn(() => null),
  getGitBranch: vi.fn(() => 'main'),
  getGitRemoteUrl: vi.fn(() => null),
  getGitCommitSha: vi.fn(() => null),
  buildCodePermalink: vi.fn(() => null),
}));

import {
  updateDecorations,
  getDecorationType,
  disposeDecorations,
  addLinkedTodo,
  clearLinkedTodos,
} from '../src/providers/todo-decoration';

describe('todo-decoration visual', () => {
  beforeEach(() => {
    clearLinkedTodos('/test/file.ts');
    // Reset decoration type
    disposeDecorations();
  });

  it('should create a decoration type', () => {
    const decType = getDecorationType();
    expect(decType).toBeDefined();
    expect(decType.dispose).toBeDefined();
  });

  it('should return the same decoration type on subsequent calls', () => {
    const dt1 = getDecorationType();
    const dt2 = getDecorationType();
    expect(dt1).toBe(dt2);
  });

  it('should update decorations for an editor with TODOs', () => {
    const mockSetDecorations = vi.fn();

    const editor = {
      document: {
        lineCount: 3,
        lineAt: (i: number) => ({
          text: ['const x = 1;', '// TODO: fix this', 'const y = 2;'][i],
        }),
        uri: { fsPath: '/test/file.ts' },
      },
      setDecorations: mockSetDecorations,
    };

    updateDecorations(editor as any);
    expect(mockSetDecorations).toHaveBeenCalled();
    const decorations = mockSetDecorations.mock.calls[0][1];
    expect(decorations.length).toBeGreaterThan(0);
  });

  it('should show linked issue key in decoration', () => {
    addLinkedTodo('/test/file.ts', 2, 'PROJ-42');
    const mockSetDecorations = vi.fn();

    const editor = {
      document: {
        lineCount: 3,
        lineAt: (i: number) => ({
          text: ['const x = 1;', '// TODO: fix this', 'const y = 2;'][i],
        }),
        uri: { fsPath: '/test/file.ts' },
      },
      setDecorations: mockSetDecorations,
    };

    updateDecorations(editor as any);
    expect(mockSetDecorations).toHaveBeenCalled();
    const decorations = mockSetDecorations.mock.calls[0][1];
    const linked = decorations.find((d: any) =>
      d.renderOptions?.after?.contentText?.includes('PROJ-42'),
    );
    expect(linked).toBeDefined();
  });

  it('should show warning for unlinked TODOs', () => {
    const mockSetDecorations = vi.fn();

    const editor = {
      document: {
        lineCount: 1,
        lineAt: () => ({ text: '// TODO: unlinked' }),
        uri: { fsPath: '/test/unlinked.ts' },
      },
      setDecorations: mockSetDecorations,
    };

    updateDecorations(editor as any);
    const decorations = mockSetDecorations.mock.calls[0][1];
    const unlinked = decorations.find((d: any) =>
      d.renderOptions?.after?.contentText?.includes('No linked issue'),
    );
    expect(unlinked).toBeDefined();
  });

  it('should handle files with no TODOs', () => {
    const mockSetDecorations = vi.fn();

    const editor = {
      document: {
        lineCount: 2,
        lineAt: (i: number) => ({
          text: ['const x = 1;', 'const y = 2;'][i],
        }),
        uri: { fsPath: '/test/clean.ts' },
      },
      setDecorations: mockSetDecorations,
    };

    updateDecorations(editor as any);
    const decorations = mockSetDecorations.mock.calls[0][1];
    expect(decorations.length).toBe(0);
  });

  it('should dispose decoration type', () => {
    getDecorationType(); // Create it
    expect(() => disposeDecorations()).not.toThrow();
    // After dispose, getDecorationType should create a new one
    const newDt = getDecorationType();
    expect(newDt).toBeDefined();
  });

  it('should handle dispose when no decoration type exists', () => {
    expect(() => disposeDecorations()).not.toThrow();
  });
});
