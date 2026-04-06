import { describe, it, expect, vi } from 'vitest';
import { TodoCodeLensProvider } from '../src/providers/todo-codelens';

function createMockDocument(lines: string[]) {
  return {
    lineCount: lines.length,
    lineAt: (i: number) => ({
      text: lines[i],
      range: { start: { line: i, character: 0 }, end: { line: i, character: lines[i].length } },
    }),
    uri: { fsPath: '/test/file.ts', scheme: 'file' },
    languageId: 'typescript',
  };
}

describe('TodoCodeLensProvider', () => {
  describe('provideCodeLenses', () => {
    it('should provide CodeLens for TODO comments', () => {
      const provider = new TodoCodeLensProvider();
      const doc = createMockDocument([
        'const x = 1;',
        '// TODO: fix this',
        'const y = 2;',
        '// FIXME: also fix this',
      ]);

      const lenses = provider.provideCodeLenses(doc as any);
      expect(lenses.length).toBe(2);
    });

    it('should provide "Create Issue" command for unlinked TODOs', () => {
      const provider = new TodoCodeLensProvider();
      const doc = createMockDocument(['// TODO: fix this']);

      const lenses = provider.provideCodeLenses(doc as any);
      expect(lenses.length).toBe(1);
      expect((lenses[0] as any).command?.title).toContain('Create Issue');
    });

    it('should return empty array for files with no TODOs', () => {
      const provider = new TodoCodeLensProvider();
      const doc = createMockDocument(['const x = 1;', 'const y = 2;']);

      const lenses = provider.provideCodeLenses(doc as any);
      expect(lenses.length).toBe(0);
    });

    it('should handle empty documents', () => {
      const provider = new TodoCodeLensProvider();
      const doc = createMockDocument([]);

      const lenses = provider.provideCodeLenses(doc as any);
      expect(lenses.length).toBe(0);
    });

    it('should detect all TODO types', () => {
      const provider = new TodoCodeLensProvider();
      const doc = createMockDocument([
        '// TODO: item 1',
        '// FIXME: item 2',
        '// HACK: item 3',
        '// BUG: item 4',
        '// XXX: item 5',
      ]);

      const lenses = provider.provideCodeLenses(doc as any);
      expect(lenses.length).toBe(5);
    });

    it('should refresh fire event', () => {
      const provider = new TodoCodeLensProvider();
      // Just call refresh to ensure it doesn't throw
      expect(() => provider.refresh()).not.toThrow();
    });
  });
});
