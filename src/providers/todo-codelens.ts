import * as vscode from 'vscode';
import { getConfig } from '../utils/config';
import { buildTodoRegex } from './todo-scanner';
import { getLinkedTodos } from './todo-decoration';

export class TodoCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const config = getConfig();
    if (!config.showCodeLens) {
      return [];
    }

    const patterns = config.patterns;
    const regex = buildTodoRegex(patterns);
    const codeLenses: vscode.CodeLens[] = [];
    const filePath = document.uri.fsPath;
    const links = getLinkedTodos(filePath);

    for (let i = 0; i < document.lineCount; i++) {
      const lineText = document.lineAt(i).text;
      if (regex.test(lineText)) {
        const range = new vscode.Range(i, 0, i, lineText.length);
        const link = links.find((l) => l.line === i + 1);

        if (link) {
          codeLenses.push(
            new vscode.CodeLens(range, {
              title: `$(link) ${link.issueKey}`,
              command: 'todoToIssue.openIssue',
              arguments: [link.issueKey],
            }),
          );
        } else {
          codeLenses.push(
            new vscode.CodeLens(range, {
              title: '$(plus) Create Issue',
              command: 'todoToIssue.createIssue',
              arguments: [i],
            }),
          );
        }
      }
    }

    return codeLenses;
  }
}
