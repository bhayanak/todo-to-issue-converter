import * as vscode from 'vscode';
import { TodoContext } from '../models/todo-item';
import { IssueAdapter, IssueCreateResult } from '../models/issue-config';
import { renderTemplate, buildTitle } from './template-engine';
import { getConfig, getLabelForTodoType } from '../utils/config';

export class JiraAdapter implements IssueAdapter {
  private baseUrl: string;
  private projectKey: string;
  private issueType: string;
  private secretStorage: vscode.SecretStorage;

  constructor(secretStorage: vscode.SecretStorage) {
    const config = getConfig();
    this.baseUrl = config.jira.baseUrl.replace(/\/+$/, '');
    this.projectKey = config.jira.projectKey;
    this.issueType = config.jira.issueType;
    this.secretStorage = secretStorage;
  }

  private async getAuth(): Promise<{ email: string; token: string }> {
    const email = await this.secretStorage.get('todoToIssue.jira.email');
    const token = await this.secretStorage.get('todoToIssue.jira.apiToken');
    if (!email || !token) {
      throw new Error(
        'Jira credentials not configured. Use command "TODO to Issue: Configure Jira Credentials" to set them up.',
      );
    }
    return { email, token };
  }

  private async makeRequest(path: string, options: RequestInit = {}): Promise<Response> {
    const { email, token } = await this.getAuth();
    const authHeader = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
    const url = `${this.baseUrl}/rest/api/3${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Jira API error (${response.status}): ${errorBody}`);
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
      fields: {
        project: { key: this.projectKey },
        summary: issueTitle,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: body,
                },
              ],
            },
          ],
        },
        issuetype: { name: this.issueType },
        labels,
      },
    };

    const response = await this.makeRequest('/issue', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { key: string };
    const issueUrl = `${this.baseUrl}/browse/${data.key}`;

    return {
      provider: 'jira',
      key: data.key,
      url: issueUrl,
      title: issueTitle,
    };
  }

  async searchDuplicates(text: string, _filePath: string): Promise<IssueCreateResult[]> {
    const jql = encodeURIComponent(
      `project = "${this.projectKey}" AND summary ~ "${text.replace(/"/g, '\\"').substring(0, 100)}" ORDER BY created DESC`,
    );

    const response = await this.makeRequest(`/search?jql=${jql}&maxResults=5`);
    const data = (await response.json()) as {
      issues: Array<{ key: string; fields: { summary: string } }>;
    };

    return data.issues.map((issue) => ({
      provider: 'jira' as const,
      key: issue.key,
      url: `${this.baseUrl}/browse/${issue.key}`,
      title: issue.fields.summary,
    }));
  }

  async getIssueStatus(key: string): Promise<string> {
    const response = await this.makeRequest(`/issue/${encodeURIComponent(key)}?fields=status`);
    const data = (await response.json()) as {
      fields: { status: { name: string } };
    };
    return data.fields.status.name;
  }

  static async validateCredentials(
    baseUrl: string,
    email: string,
    token: string,
  ): Promise<{ valid: boolean; message: string }> {
    try {
      const url = `${baseUrl.replace(/\/+$/, '')}/rest/api/3/myself`;
      const authHeader = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
      const response = await fetch(url, {
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });
      if (response.ok) {
        const data = (await response.json()) as { displayName: string };
        return { valid: true, message: `Authenticated as ${data.displayName}` };
      }
      const errorBody = await response.text();
      return { valid: false, message: `Authentication failed (${response.status}): ${errorBody}` };
    } catch (error) {
      return {
        valid: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
