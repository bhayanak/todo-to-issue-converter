import { describe, it, expect } from 'vitest';
import {
  IssueCreateResult,
  IssueAdapter,
  TodoScanResult,
  ExtensionConfig,
} from '../src/models/issue-config';
import { TodoContext, GitBlameInfo } from '../src/models/todo-item';

describe('TodoContext model', () => {
  it('should be constructible with all fields', () => {
    const ctx: TodoContext = {
      filePath: 'src/main.ts',
      absolutePath: '/root/src/main.ts',
      lineNumber: 10,
      todoType: 'TODO',
      todoText: 'fix bug',
      language: 'typescript',
      surroundingCode: '// TODO: fix bug',
      gitBlame: {
        author: 'John',
        email: 'john@test.com',
        date: '2024-01-01',
        commit: 'abc',
      },
      gitBranch: 'main',
      repoUrl: 'https://github.com/test/repo',
      codePermalink: 'https://github.com/test/repo/blob/abc/src/main.ts#L10',
    };

    expect(ctx.filePath).toBe('src/main.ts');
    expect(ctx.lineNumber).toBe(10);
    expect(ctx.todoType).toBe('TODO');
    expect(ctx.gitBlame?.author).toBe('John');
  });

  it('should allow null git fields', () => {
    const ctx: TodoContext = {
      filePath: 'src/main.ts',
      absolutePath: '/root/src/main.ts',
      lineNumber: 10,
      todoType: 'TODO',
      todoText: 'fix bug',
      language: 'typescript',
      surroundingCode: '',
      gitBlame: null,
      gitBranch: null,
      repoUrl: null,
      codePermalink: null,
    };

    expect(ctx.gitBlame).toBeNull();
    expect(ctx.gitBranch).toBeNull();
    expect(ctx.repoUrl).toBeNull();
    expect(ctx.codePermalink).toBeNull();
  });
});

describe('GitBlameInfo model', () => {
  it('should hold blame data', () => {
    const blame: GitBlameInfo = {
      author: 'Alice',
      email: 'alice@test.com',
      date: '2024-06-15',
      commit: 'def456',
    };
    expect(blame.author).toBe('Alice');
    expect(blame.commit).toBe('def456');
  });
});

describe('IssueCreateResult model', () => {
  it('should hold Jira result', () => {
    const result: IssueCreateResult = {
      provider: 'jira',
      key: 'PROJ-123',
      url: 'https://company.atlassian.net/browse/PROJ-123',
      title: 'Fix auth',
    };
    expect(result.provider).toBe('jira');
    expect(result.key).toBe('PROJ-123');
  });

  it('should hold GitHub result', () => {
    const result: IssueCreateResult = {
      provider: 'github',
      key: '#42',
      url: 'https://github.com/owner/repo/issues/42',
      title: 'Fix bug',
    };
    expect(result.provider).toBe('github');
    expect(result.key).toBe('#42');
  });
});

describe('TodoScanResult model', () => {
  it('should hold scan result with optional linkedIssue', () => {
    const result: TodoScanResult = {
      type: 'TODO',
      text: 'fix this',
      file: 'src/main.ts',
      line: 10,
    };
    expect(result.linkedIssue).toBeUndefined();

    const linkedResult: TodoScanResult = {
      type: 'TODO',
      text: 'fix this',
      file: 'src/main.ts',
      line: 10,
      linkedIssue: 'PROJ-1',
    };
    expect(linkedResult.linkedIssue).toBe('PROJ-1');
  });
});

describe('ExtensionConfig model', () => {
  it('should have all required fields', () => {
    const config: ExtensionConfig = {
      provider: 'jira',
      jira: {
        baseUrl: 'https://test.atlassian.net',
        projectKey: 'TEST',
        issueType: 'Task',
      },
      github: {
        owner: 'owner',
        repo: 'repo',
      },
      patterns: ['TODO'],
      contextLines: 5,
      includeGitBlame: true,
      autoLabel: true,
      showCodeLens: true,
      duplicateDetection: true,
    };
    expect(config.provider).toBe('jira');
    expect(config.patterns.length).toBe(1);
  });
});
