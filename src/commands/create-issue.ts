import * as vscode from 'vscode';
import { extractContext } from '../services/context-extractor';
import { JiraAdapter } from '../services/jira-adapter';
import { GitHubAdapter } from '../services/github-adapter';
import { DuplicateDetector } from '../services/duplicate-detector';
import { getConfig } from '../utils/config';
import { IssueAdapter } from '../models/issue-config';
import { addLinkedTodo } from '../providers/todo-decoration';
import { buildTitle } from '../services/template-engine';

export function getAdapter(secretStorage: vscode.SecretStorage): IssueAdapter {
  const config = getConfig();
  return config.provider === 'github'
    ? new GitHubAdapter(secretStorage)
    : new JiraAdapter(secretStorage);
}

export async function createIssueCommand(
  secretStorage: vscode.SecretStorage,
  lineNumber?: number,
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor found.');
    return;
  }

  const context = extractContext(editor, lineNumber);
  if (!context) {
    vscode.window.showWarningMessage('No TODO/FIXME/HACK/BUG comment found on the current line.');
    return;
  }

  const config = getConfig();
  const adapter = getAdapter(secretStorage);

  // Duplicate detection
  if (config.duplicateDetection) {
    try {
      const detector = new DuplicateDetector(adapter);
      const duplicates = await detector.findDuplicates(context.todoText, context.filePath);
      const relevant = detector.filterRelevant(duplicates, context.todoText);

      if (relevant.length > 0) {
        const items = relevant.map((d) => ({
          label: d.key,
          description: d.title,
          detail: d.url,
          issueKey: d.key,
        }));

        items.unshift({
          label: '$(plus) Create New Issue',
          description: 'Create a new issue anyway',
          detail: '',
          issueKey: '',
        });

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Similar issues found. Select one to link, or create new.',
        });

        if (!selected) {
          return; // User cancelled
        }

        if (selected.issueKey) {
          // Link existing issue
          addLinkedTodo(editor.document.uri.fsPath, context.lineNumber, selected.issueKey);
          vscode.window.showInformationMessage(`Linked to existing issue: ${selected.issueKey}`);
          return;
        }
      }
    } catch {
      // Duplicate detection failed — proceed with creation
    }
  }

  // Create the issue
  try {
    const title = buildTitle(context);

    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Creating ${config.provider} issue...`,
        cancellable: false,
      },
      async () => adapter.createIssue(context, title),
    );

    addLinkedTodo(editor.document.uri.fsPath, context.lineNumber, result.key);

    const openAction = 'Open Issue';
    const action = await vscode.window.showInformationMessage(
      `Issue created: ${result.key}`,
      openAction,
    );

    if (action === openAction) {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(result.url));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to create issue: ${message}`);
  }
}
