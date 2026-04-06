import * as vscode from 'vscode';
import { getConfig } from '../utils/config';
import { buildTodoRegex } from './todo-scanner';

interface TodoLink {
  line: number;
  issueKey: string;
}

const linkedTodos: Map<string, TodoLink[]> = new Map();

export function addLinkedTodo(filePath: string, line: number, issueKey: string): void {
  const links = linkedTodos.get(filePath) || [];
  const existing = links.find((l) => l.line === line);
  if (existing) {
    existing.issueKey = issueKey;
  } else {
    links.push({ line, issueKey });
  }
  linkedTodos.set(filePath, links);
}

export function getLinkedTodos(filePath: string): TodoLink[] {
  return linkedTodos.get(filePath) || [];
}

export function clearLinkedTodos(filePath: string): void {
  linkedTodos.delete(filePath);
}

let decorationType: vscode.TextEditorDecorationType | null = null;

export function getDecorationType(): vscode.TextEditorDecorationType {
  if (!decorationType) {
    decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: '0 0 0 1em',
        color: '#6A9955',
        fontStyle: 'italic',
      },
    });
  }
  return decorationType;
}

export function updateDecorations(editor: vscode.TextEditor): void {
  const config = getConfig();
  const patterns = config.patterns;
  const regex = buildTodoRegex(patterns);
  const document = editor.document;
  const filePath = document.uri.fsPath;
  const links = getLinkedTodos(filePath);
  const decorations: vscode.DecorationOptions[] = [];

  for (let i = 0; i < document.lineCount; i++) {
    const lineText = document.lineAt(i).text;
    if (regex.test(lineText)) {
      const link = links.find((l) => l.line === i + 1);
      const range = new vscode.Range(i, lineText.length, i, lineText.length);

      if (link) {
        decorations.push({
          range,
          renderOptions: {
            after: {
              contentText: ` → ${link.issueKey}`,
              color: '#6A9955',
            },
          },
        });
      } else {
        decorations.push({
          range,
          renderOptions: {
            after: {
              contentText: ' ⚠ No linked issue',
              color: '#CCA700',
            },
          },
        });
      }
    }
  }

  editor.setDecorations(getDecorationType(), decorations);
}

export function disposeDecorations(): void {
  if (decorationType) {
    decorationType.dispose();
    decorationType = null;
  }
}
