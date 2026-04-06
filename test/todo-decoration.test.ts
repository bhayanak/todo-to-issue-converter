import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addLinkedTodo, getLinkedTodos, clearLinkedTodos } from '../src/providers/todo-decoration';

describe('todo-decoration link tracking', () => {
  beforeEach(() => {
    clearLinkedTodos('/test/file.ts');
  });

  describe('addLinkedTodo', () => {
    it('should add a linked TODO', () => {
      addLinkedTodo('/test/file.ts', 10, 'PROJ-123');
      const links = getLinkedTodos('/test/file.ts');
      expect(links.length).toBe(1);
      expect(links[0].line).toBe(10);
      expect(links[0].issueKey).toBe('PROJ-123');
    });

    it('should update existing link on same line', () => {
      addLinkedTodo('/test/file.ts', 10, 'PROJ-123');
      addLinkedTodo('/test/file.ts', 10, 'PROJ-456');
      const links = getLinkedTodos('/test/file.ts');
      expect(links.length).toBe(1);
      expect(links[0].issueKey).toBe('PROJ-456');
    });

    it('should support multiple links for different lines', () => {
      addLinkedTodo('/test/file.ts', 10, 'PROJ-1');
      addLinkedTodo('/test/file.ts', 20, 'PROJ-2');
      addLinkedTodo('/test/file.ts', 30, 'PROJ-3');
      const links = getLinkedTodos('/test/file.ts');
      expect(links.length).toBe(3);
    });

    it('should support multiple files', () => {
      addLinkedTodo('/test/a.ts', 1, 'P-1');
      addLinkedTodo('/test/b.ts', 1, 'P-2');
      expect(getLinkedTodos('/test/a.ts').length).toBe(1);
      expect(getLinkedTodos('/test/b.ts').length).toBe(1);
    });
  });

  describe('getLinkedTodos', () => {
    it('should return empty array for unknown files', () => {
      const links = getLinkedTodos('/nonexistent/file.ts');
      expect(links).toEqual([]);
    });
  });

  describe('clearLinkedTodos', () => {
    it('should clear all links for a file', () => {
      addLinkedTodo('/test/file.ts', 10, 'PROJ-1');
      addLinkedTodo('/test/file.ts', 20, 'PROJ-2');
      clearLinkedTodos('/test/file.ts');
      expect(getLinkedTodos('/test/file.ts')).toEqual([]);
    });

    it('should not affect other files', () => {
      addLinkedTodo('/test/a.ts', 1, 'P-1');
      addLinkedTodo('/test/b.ts', 1, 'P-2');
      clearLinkedTodos('/test/a.ts');
      expect(getLinkedTodos('/test/a.ts')).toEqual([]);
      expect(getLinkedTodos('/test/b.ts').length).toBe(1);
    });
  });
});
