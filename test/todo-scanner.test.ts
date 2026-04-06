import { describe, it, expect } from 'vitest';
import { scanLine, scanText, buildTodoRegex } from '../src/providers/todo-scanner';
import * as fs from 'fs';
import * as path from 'path';

describe('buildTodoRegex', () => {
  it('should create a regex matching default patterns', () => {
    const regex = buildTodoRegex(['TODO', 'FIXME', 'HACK', 'BUG', 'XXX']);
    expect(regex.test('TODO: fix this')).toBe(true);
    expect(regex.test('FIXME: broken')).toBe(true);
    expect(regex.test('HACK: workaround')).toBe(true);
    expect(regex.test('BUG: fails on edge case')).toBe(true);
    expect(regex.test('XXX: needs review')).toBe(true);
  });

  it('should be case-insensitive', () => {
    const regex = buildTodoRegex(['TODO']);
    expect(regex.test('todo: lowercase')).toBe(true);
    expect(regex.test('Todo: mixed case')).toBe(true);
  });

  it('should match patterns with colon', () => {
    const regex = buildTodoRegex(['TODO']);
    expect(regex.test('TODO: with colon')).toBe(true);
  });

  it('should match patterns without colon', () => {
    const regex = buildTodoRegex(['TODO']);
    expect(regex.test('TODO fix this')).toBe(true);
  });

  it('should handle special regex characters in patterns', () => {
    const regex = buildTodoRegex(['TODO(owner)']);
    expect(regex).toBeDefined();
  });
});

describe('scanLine', () => {
  const patterns = ['TODO', 'FIXME', 'HACK', 'BUG', 'XXX'];

  it('should detect a TODO comment with //', () => {
    const result = scanLine('  // TODO: fix the login flow', 10, 'test.ts', patterns);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('TODO');
    expect(result!.text).toBe('fix the login flow');
    expect(result!.line).toBe(10);
    expect(result!.file).toBe('test.ts');
  });

  it('should detect a FIXME comment with #', () => {
    const result = scanLine('# FIXME: broken parser', 5, 'test.py', patterns);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('FIXME');
    expect(result!.text).toBe('broken parser');
  });

  it('should detect a HACK comment', () => {
    const result = scanLine('  // HACK: temporary workaround', 3, 'test.ts', patterns);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('HACK');
  });

  it('should detect a BUG comment', () => {
    const result = scanLine('  // BUG: fails on empty input', 7, 'test.ts', patterns);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('BUG');
  });

  it('should detect an XXX comment', () => {
    const result = scanLine('  // XXX: needs review', 12, 'test.ts', patterns);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('XXX');
  });

  it('should detect TODO in block comments', () => {
    const result = scanLine('  * TODO: inside block comment', 5, 'test.ts', patterns);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('TODO');
  });

  it('should detect TODO in HTML comments', () => {
    const result = scanLine('<!-- TODO: fix layout -->', 3, 'test.html', patterns);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('TODO');
  });

  it('should detect TODO in SQL comments', () => {
    const result = scanLine('-- TODO: optimize query', 1, 'test.sql', patterns);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('TODO');
  });

  it('should return null for lines without TODO patterns', () => {
    const result = scanLine('  const x = 42;', 1, 'test.ts', patterns);
    expect(result).toBeNull();
  });

  it('should detect linked issues in TODO text', () => {
    const result = scanLine('  // TODO(PROJ-123): fix this later', 5, 'test.ts', patterns);
    expect(result).not.toBeNull();
    expect(result!.linkedIssue).toBe('PROJ-123');
  });

  it('should detect linked GitHub issues', () => {
    const result = scanLine('  // TODO(#456): fix this later', 5, 'test.ts', patterns);
    expect(result).not.toBeNull();
    expect(result!.linkedIssue).toBe('#456');
  });

  it('should handle empty TODO text', () => {
    const result = scanLine('  // TODO:', 1, 'test.ts', patterns);
    expect(result).not.toBeNull();
    expect(result!.text).toBe('');
  });

  it('should handle TODO without colon or text', () => {
    const result = scanLine('  // TODO', 1, 'test.ts', patterns);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('TODO');
  });

  it('should detect TODO in Python comments', () => {
    const result = scanLine('  # TODO: refactor this module', 15, 'app.py', patterns);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('TODO');
    expect(result!.text).toBe('refactor this module');
  });

  it('should handle TODO with extra whitespace', () => {
    const result = scanLine('  //   TODO:   lots of spaces   ', 1, 'test.ts', patterns);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('TODO');
    expect(result!.text).toBe('lots of spaces');
  });
});

describe('scanText', () => {
  const patterns = ['TODO', 'FIXME', 'HACK', 'BUG', 'XXX'];

  it('should scan multi-line text and find all TODOs', () => {
    const content = `
// TODO: first item
const x = 1;
// FIXME: second item
// nothing here
# HACK: third item
    `.trim();

    const results = scanText(content, 'test.ts', patterns);
    expect(results.length).toBe(3);
    expect(results[0].type).toBe('TODO');
    expect(results[0].line).toBe(1);
    expect(results[1].type).toBe('FIXME');
    expect(results[1].line).toBe(3);
    expect(results[2].type).toBe('HACK');
    expect(results[2].line).toBe(5);
  });

  it('should return empty array for text with no TODOs', () => {
    const content = 'const x = 1;\nconst y = 2;';
    const results = scanText(content, 'test.ts', patterns);
    expect(results.length).toBe(0);
  });

  it('should scan the sample fixture file', () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'sample-file.ts');
    const content = fs.readFileSync(fixturePath, 'utf-8');
    const results = scanText(content, 'fixtures/sample-file.ts', patterns);
    expect(results.length).toBeGreaterThanOrEqual(5);
  });

  it('should handle empty content', () => {
    const results = scanText('', 'test.ts', patterns);
    expect(results.length).toBe(0);
  });

  it('should handle single line content', () => {
    const results = scanText('// TODO: single line', 'test.ts', patterns);
    expect(results.length).toBe(1);
    expect(results[0].line).toBe(1);
  });
});
