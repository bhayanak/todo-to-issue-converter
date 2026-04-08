import * as vscode from 'vscode';
import * as path from 'path';
import { TodoContext } from '../models/todo-item';
import {
  getGitBlame,
  getGitBranch,
  getGitRemoteUrl,
  getGitCommitSha,
  buildCodePermalink,
} from '../utils/git-utils';
import { getConfig } from '../utils/config';
import { buildTodoRegex } from '../providers/todo-scanner';

export function extractContext(editor: vscode.TextEditor, lineNumber?: number): TodoContext | null {
  const config = getConfig();
  const document = editor.document;
  const line = lineNumber !== undefined ? lineNumber : editor.selection.active.line;
  const lineText = document.lineAt(line).text;

  const regex = buildTodoRegex(config.patterns);
  const match = lineText.match(regex);

  if (!match) {
    return null;
  }

  const todoType = match[1].toUpperCase();
  const todoText = match[2]?.trim() || '';
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
  const absolutePath = document.uri.fsPath;
  const fileDir = path.dirname(absolutePath);
  const relativePath = workspaceFolder
    ? path.relative(workspaceFolder, absolutePath)
    : absolutePath;

  // Use workspace folder if available, otherwise use file's directory for git commands
  const gitCwd = workspaceFolder || fileDir;

  const contextLines = config.contextLines;
  const startLine = Math.max(0, line - contextLines);
  const endLine = Math.min(document.lineCount - 1, line + contextLines);
  const surroundingLines: string[] = [];
  for (let i = startLine; i <= endLine; i++) {
    surroundingLines.push(document.lineAt(i).text);
  }
  const surroundingCode = surroundingLines.join('\n');

  const gitBlame = config.includeGitBlame ? getGitBlame(absolutePath, line + 1) : null;
  const gitBranch = getGitBranch(gitCwd);
  const repoUrl = getGitRemoteUrl(gitCwd);
  const commitSha = getGitCommitSha(gitCwd);
  const codePermalink = buildCodePermalink(repoUrl, commitSha, relativePath, line + 1);

  return {
    filePath: relativePath,
    absolutePath,
    lineNumber: line + 1,
    todoType,
    todoText,
    language: document.languageId,
    surroundingCode,
    gitBlame,
    gitBranch,
    repoUrl,
    codePermalink,
  };
}
