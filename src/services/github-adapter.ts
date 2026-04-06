import * as vscode from 'vscode';
import { TodoContext } from '../models/todo-item';
import { IssueAdapter, IssueCreateResult } from '../models/issue-config';
import { renderTemplate, buildTitle } from './template-engine';
import { getConfig, getLabelForTodoType } from '../utils/config';

export class GitHubAdapter implements IssueAdapter {
  private owner: string;
  private repo: string;
  private secretStorage: vscode.SecretStorage;

  constructor(secretStorage: vscode.SecretStorage) {
    const config = getConfig();
    this.owner = config.github.owner;
    this.repo = config.github.repo;
    this.secretStorage = secretStorage;
  }

  private async getToken(): Promise<string> {
    const token = await this.secretStorage.get('todoToIssue.github.token');
    if (!token) {
      throw new Error(
        'GitHub token not configured. Use command "TODO to Issue: Configure GitHub Token" to set it up.',
      );
    }
    return token;
  }

  private async makeRequest(path: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getToken();
    const url = `https://api.github.com${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${errorBody}`);
    }

    return response;
  }

  async createIssue(context: TodoContext, title?: string): Promise<IssueCreateResult> {
    const config = getConfig();
    const issueTitle = title || buildTitle(context);
    const body = renderTemplate(context);

    const labels: string[] = [];
    if (config.autoLabel) {
      labels.push(getLabelForTodoType(context.todoType));
    }

    const payload = {
      title: issueTitle,
      body,
      labels,
    };

    const response = await this.makeRequest(
      `/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/issues`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );

    const data = (await response.json()) as {
      number: number;
      html_url: string;
    };

    return {
      provider: 'github',
      key: `#${data.number}`,
      url: data.html_url,
      title: issueTitle,
    };
  }

  async searchDuplicates(text: string, _filePath: string): Promise<IssueCreateResult[]> {
    const query = encodeURIComponent(
      `repo:${this.owner}/${this.repo} is:issue ${text.substring(0, 100)}`,
    );

    const response = await this.makeRequest(`/search/issues?q=${query}&per_page=5`);
    const data = (await response.json()) as {
      items: Array<{ number: number; html_url: string; title: string }>;
    };

    return data.items.map((item) => ({
      provider: 'github' as const,
      key: `#${item.number}`,
      url: item.html_url,
      title: item.title,
    }));
  }

  async getIssueStatus(key: string): Promise<string> {
    const issueNumber = key.replace('#', '');
    const response = await this.makeRequest(
      `/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/issues/${issueNumber}`,
    );
    const data = (await response.json()) as { state: string };
    return data.state;
  }
}
