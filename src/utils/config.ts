import * as vscode from 'vscode';
import { ExtensionConfig } from '../models/issue-config';

export function getConfig(): ExtensionConfig {
  const cfg = vscode.workspace.getConfiguration('todoToIssue');

  return {
    provider: cfg.get<'jira' | 'github'>('provider', 'jira'),
    jira: {
      baseUrl: cfg.get<string>('jira.baseUrl', ''),
      projectKey: cfg.get<string>('jira.projectKey', ''),
      issueType: cfg.get<string>('jira.issueType', 'Task'),
    },
    github: {
      owner: cfg.get<string>('github.owner', ''),
      repo: cfg.get<string>('github.repo', ''),
    },
    patterns: cfg.get<string[]>('patterns', ['TODO', 'FIXME', 'HACK', 'BUG', 'XXX']),
    contextLines: cfg.get<number>('contextLines', 5),
    includeGitBlame: cfg.get<boolean>('includeGitBlame', true),
    autoLabel: cfg.get<boolean>('autoLabel', true),
    showCodeLens: cfg.get<boolean>('showCodeLens', true),
    duplicateDetection: cfg.get<boolean>('duplicateDetection', true),
  };
}

export function getLabelForTodoType(todoType: string): string {
  const labelMap: Record<string, string> = {
    TODO: 'enhancement',
    FIXME: 'bug',
    HACK: 'tech-debt',
    BUG: 'bug',
    XXX: 'needs-review',
  };
  return labelMap[todoType.toUpperCase()] || 'todo';
}
