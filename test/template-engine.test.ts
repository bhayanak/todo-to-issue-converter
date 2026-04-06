import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderTemplate, buildTitle } from '../src/services/template-engine';
import { TodoContext } from '../src/models/todo-item';

function createMockContext(overrides: Partial<TodoContext> = {}): TodoContext {
  return {
    filePath: 'src/services/auth.ts',
    absolutePath: '/workspace/src/services/auth.ts',
    lineNumber: 42,
    todoType: 'TODO',
    todoText: 'Refactor authentication middleware',
    language: 'typescript',
    surroundingCode:
      'const auth = () => {\n  // TODO: Refactor authentication middleware\n  return true;\n}',
    gitBlame: {
      author: 'Jane Doe',
      email: 'jane@example.com',
      date: '2024-01-15T10:30:00.000Z',
      commit: 'abc123',
    },
    gitBranch: 'feature/auth-refactor',
    repoUrl: 'https://github.com/test/repo',
    codePermalink: 'https://github.com/test/repo/blob/abc123/src/services/auth.ts#L42',
    ...overrides,
  };
}

describe('renderTemplate', () => {
  it('should render default template with all fields', () => {
    const ctx = createMockContext();
    const result = renderTemplate(ctx);

    expect(result).toContain('TODO');
    expect(result).toContain('src/services/auth.ts:42');
    expect(result).toContain('feature/auth-refactor');
    expect(result).toContain('Jane Doe');
    expect(result).toContain('Refactor authentication middleware');
    expect(result).toContain('typescript');
    expect(result).toContain('https://github.com/test/repo');
  });

  it('should handle null git blame', () => {
    const ctx = createMockContext({ gitBlame: null });
    const result = renderTemplate(ctx);
    expect(result).toContain('N/A');
  });

  it('should handle null git branch', () => {
    const ctx = createMockContext({ gitBranch: null });
    const result = renderTemplate(ctx);
    expect(result).toContain('N/A');
  });

  it('should handle null repo URL', () => {
    const ctx = createMockContext({ repoUrl: null });
    const result = renderTemplate(ctx);
    expect(result).toContain('N/A');
  });

  it('should handle null code permalink', () => {
    const ctx = createMockContext({ codePermalink: null });
    const result = renderTemplate(ctx);
    expect(result).toContain('N/A');
  });

  it('should sanitize HTML in fields to prevent injection', () => {
    const ctx = createMockContext({
      todoText: '<script>alert("xss")</script>',
    });
    const result = renderTemplate(ctx);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('should use custom template when provided', () => {
    const ctx = createMockContext();
    const template = 'Custom: {{todoType}} - {{todoText}}';
    const result = renderTemplate(ctx, template);
    expect(result).toBe('Custom: TODO - Refactor authentication middleware');
  });

  it('should handle templates with no placeholders', () => {
    const ctx = createMockContext();
    const template = 'No placeholders here';
    const result = renderTemplate(ctx, template);
    expect(result).toBe('No placeholders here');
  });

  it('should handle FIXME type', () => {
    const ctx = createMockContext({ todoType: 'FIXME' });
    const result = renderTemplate(ctx);
    expect(result).toContain('FIXME');
  });

  it('should include surrounding code in output', () => {
    const ctx = createMockContext({
      surroundingCode: 'line1\nline2\nline3',
    });
    const result = renderTemplate(ctx);
    expect(result).toContain('line1\nline2\nline3');
  });

  it('should handle empty todoText', () => {
    const ctx = createMockContext({ todoText: '' });
    const result = renderTemplate(ctx);
    expect(result).toBeDefined();
  });
});

describe('buildTitle', () => {
  it('should build title with TODO type prefix', () => {
    const ctx = createMockContext();
    const title = buildTitle(ctx);
    expect(title).toBe('[TODO] Refactor authentication middleware');
  });

  it('should truncate long titles', () => {
    const longText = 'A'.repeat(200);
    const ctx = createMockContext({ todoText: longText });
    const title = buildTitle(ctx);
    expect(title.length).toBeLessThanOrEqual(100);
    expect(title.endsWith('...')).toBe(true);
  });

  it('should use file path when text is empty', () => {
    const ctx = createMockContext({ todoText: '' });
    const title = buildTitle(ctx);
    expect(title).toContain('src/services/auth.ts:42');
  });

  it('should handle different TODO types', () => {
    const types = ['TODO', 'FIXME', 'HACK', 'BUG', 'XXX'];
    types.forEach((type) => {
      const ctx = createMockContext({ todoType: type });
      const title = buildTitle(ctx);
      expect(title).toContain(`[${type}]`);
    });
  });

  it('should handle short text without truncation', () => {
    const ctx = createMockContext({ todoText: 'Fix bug' });
    const title = buildTitle(ctx);
    expect(title).toBe('[TODO] Fix bug');
    expect(title.endsWith('...')).toBe(false);
  });
});
