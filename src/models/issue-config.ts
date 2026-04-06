import { TodoContext } from './todo-item';

export interface IssueCreateResult {
  provider: 'jira' | 'github';
  key: string;
  url: string;
  title: string;
}

export interface IssueAdapter {
  createIssue(context: TodoContext, title: string): Promise<IssueCreateResult>;
  searchDuplicates(text: string, filePath: string): Promise<IssueCreateResult[]>;
  getIssueStatus(key: string): Promise<string>;
}

export interface TodoScanResult {
  type: string;
  text: string;
  file: string;
  line: number;
  linkedIssue?: string;
}

export interface ExtensionConfig {
  provider: 'jira' | 'github';
  jira: {
    baseUrl: string;
    projectKey: string;
    issueType: string;
  };
  github: {
    owner: string;
    repo: string;
  };
  patterns: string[];
  contextLines: number;
  includeGitBlame: boolean;
  autoLabel: boolean;
  showCodeLens: boolean;
  duplicateDetection: boolean;
}
