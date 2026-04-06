import * as vscode from 'vscode';
import { createIssueCommand } from './commands/create-issue';
import { bulkScanCommand } from './commands/bulk-scan';
import { linkExistingCommand } from './commands/link-existing';
import { TodoCodeLensProvider } from './providers/todo-codelens';
import { updateDecorations, disposeDecorations } from './providers/todo-decoration';

export function activate(context: vscode.ExtensionContext): void {
  const secretStorage = context.secrets;

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('todoToIssue.createIssue', (lineNumber?: number) =>
      createIssueCommand(secretStorage, lineNumber),
    ),
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
      vscode.window.showInformationMessage('Jira credentials saved securely.');
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
      vscode.window.showInformationMessage('GitHub token saved securely.');
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
