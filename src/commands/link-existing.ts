import * as vscode from 'vscode';
import { extractContext } from '../services/context-extractor';
import { addLinkedTodo } from '../providers/todo-decoration';

export async function linkExistingCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('No active editor found.');
    return;
  }

  const context = extractContext(editor);
  if (!context) {
    vscode.window.showWarningMessage('No TODO/FIXME/HACK/BUG comment found on the current line.');
    return;
  }

  const issueKey = await vscode.window.showInputBox({
    prompt: 'Enter issue key to link (e.g., PROJ-123 or #456)',
    placeHolder: 'PROJ-123',
    validateInput: (value) => {
      if (!value) {
        return 'Issue key is required';
      }
      if (!/^([A-Z]+-\d+|#\d+)$/i.test(value)) {
        return 'Invalid issue key format. Use PROJ-123 or #456';
      }
      return null;
    },
  });

  if (!issueKey) {
    return; // User cancelled
  }

  addLinkedTodo(editor.document.uri.fsPath, context.lineNumber, issueKey.toUpperCase());
  vscode.window.showInformationMessage(`Linked TODO at line ${context.lineNumber} to ${issueKey}`);
}
