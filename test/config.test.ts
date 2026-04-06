import { describe, it, expect } from 'vitest';
import { getConfig, getLabelForTodoType } from '../src/utils/config';

describe('getConfig', () => {
  it('should return default configuration', () => {
    const config = getConfig();
    expect(config.provider).toBe('jira');
    expect(config.jira.baseUrl).toBe('https://test.atlassian.net');
    expect(config.jira.projectKey).toBe('TEST');
    expect(config.jira.issueType).toBe('Task');
    expect(config.github.owner).toBe('test-owner');
    expect(config.github.repo).toBe('test-repo');
    expect(config.patterns).toEqual(['TODO', 'FIXME', 'HACK', 'BUG', 'XXX']);
    expect(config.contextLines).toBe(5);
    expect(config.includeGitBlame).toBe(true);
    expect(config.autoLabel).toBe(true);
    expect(config.showCodeLens).toBe(true);
    expect(config.duplicateDetection).toBe(true);
  });
});

describe('getLabelForTodoType', () => {
  it('should return "enhancement" for TODO', () => {
    expect(getLabelForTodoType('TODO')).toBe('enhancement');
  });

  it('should return "bug" for FIXME', () => {
    expect(getLabelForTodoType('FIXME')).toBe('bug');
  });

  it('should return "tech-debt" for HACK', () => {
    expect(getLabelForTodoType('HACK')).toBe('tech-debt');
  });

  it('should return "bug" for BUG', () => {
    expect(getLabelForTodoType('BUG')).toBe('bug');
  });

  it('should return "needs-review" for XXX', () => {
    expect(getLabelForTodoType('XXX')).toBe('needs-review');
  });

  it('should return "todo" for unknown types', () => {
    expect(getLabelForTodoType('UNKNOWN')).toBe('todo');
  });

  it('should be case-insensitive via toUpperCase', () => {
    expect(getLabelForTodoType('todo')).toBe('enhancement');
    expect(getLabelForTodoType('fixme')).toBe('bug');
  });

  it('should handle empty string', () => {
    expect(getLabelForTodoType('')).toBe('todo');
  });
});
