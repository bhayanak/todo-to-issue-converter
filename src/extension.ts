import * as vscode from 'vscode';
import { createIssueCommand } from './commands/create-issue';
import { bulkScanCommand } from './commands/bulk-scan';
import { linkExistingCommand } from './commands/link-existing';
import { TodoCodeLensProvider } from './providers/todo-codelens';
import {
  updateDecorations,
  disposeDecorations,
  initLinkStorage,
} from './providers/todo-decoration';
import { GitHubAdapter } from './services/github-adapter';
import { JiraAdapter } from './services/jira-adapter';
import { getConfig } from './utils/config';

export function activate(context: vscode.ExtensionContext): void {
  const secretStorage = context.secrets;

  // Restore persisted issue links
  initLinkStorage(context.workspaceState);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('todoToIssue.createIssue', (arg?: unknown) => {
      // When invoked from context menu, arg is a URI — ignore it.
      // When invoked from CodeLens, arg is a line number.
      const lineNumber = typeof arg === 'number' ? arg : undefined;
      return createIssueCommand(secretStorage, lineNumber);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('todoToIssue.bulkScan', () => bulkScanCommand()),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('todoToIssue.linkExisting', () => linkExistingCommand()),
  );

  // Store credentials commands
  context.subscriptions.push(
    vscode.commands.registerCommand('todoToIssue.configureJira', async () => {
      const email = await vscode.window.showInputBox({
        prompt: 'Enter your Jira email',
        placeHolder: 'user@company.com',
      });
      if (!email) return;

      const token = await vscode.window.showInputBox({
        prompt: 'Enter your Jira API token',
        password: true,
      });
      if (!token) return;

      await secretStorage.store('todoToIssue.jira.email', email);
      await secretStorage.store('todoToIssue.jira.apiToken', token);

      // Validate credentials
      const config = getConfig();
      if (config.jira.baseUrl) {
        const result = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Validating Jira credentials...',
          },
          () => JiraAdapter.validateCredentials(config.jira.baseUrl, email, token),
        );
        if (result.valid) {
          vscode.window.showInformationMessage(`Jira credentials saved. ${result.message}`);
        } else {
          vscode.window.showWarningMessage(
            `Jira credentials saved but validation failed: ${result.message}. Check your email, token, and base URL.`,
          );
        }
      } else {
        vscode.window.showInformationMessage(
          'Jira credentials saved. Configure todoToIssue.jira.baseUrl in settings to enable validation.',
        );
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('todoToIssue.configureGitHub', async () => {
      const token = await vscode.window.showInputBox({
        prompt: 'Enter your GitHub personal access token',
        password: true,
      });
      if (!token) return;

      await secretStorage.store('todoToIssue.github.token', token);

      // Validate token
      const result = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Validating GitHub token...' },
        () => GitHubAdapter.validateToken(token),
      );
      if (result.valid) {
        vscode.window.showInformationMessage(`GitHub token saved. ${result.message}`);
      } else {
        vscode.window.showWarningMessage(
          `GitHub token saved but validation failed: ${result.message}. Check your token has the correct scopes (repo).`,
        );
      }
    }),
  );

  // Open issue URL command
  context.subscriptions.push(
    vscode.commands.registerCommand('todoToIssue.openIssue', (issueKey: string) => {
      // This is a simplified version — in production you'd look up the URL
      vscode.window.showInformationMessage(`Issue: ${issueKey}`);
    }),
  );

  // Register CodeLens provider
  const codeLensProvider = new TodoCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ scheme: 'file' }, codeLensProvider),
  );

  // Update decorations on editor changes
  const updateActiveEditor = () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      updateDecorations(editor);
    }
  };

  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateActiveEditor));

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) {
        updateDecorations(editor);
      }
    }),
  );

  // Initial decoration update
  updateActiveEditor();
}

export function deactivate(): void {
  disposeDecorations();
}
