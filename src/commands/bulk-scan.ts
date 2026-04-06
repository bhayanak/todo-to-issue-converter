import * as vscode from 'vscode';
import { scanText } from '../providers/todo-scanner';
import { getConfig } from '../utils/config';
import { TodoScanResult } from '../models/issue-config';

export async function bulkScanCommand(): Promise<TodoScanResult[]> {
  const config = getConfig();

  const results = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Scanning workspace for TODOs...',
      cancellable: false,
    },
    async (progress) => {
      const files = await vscode.workspace.findFiles(
        '**/*.{ts,js,tsx,jsx,py,java,go,rs,rb,php,c,cpp,h,hpp,cs,swift,kt,scala,sh,yaml,yml,md}',
        '**/node_modules/**',
      );

      const allResults: TodoScanResult[] = [];

      for (let i = 0; i < files.length; i++) {
        progress.report({
          message: `Scanning file ${i + 1}/${files.length}`,
          increment: 100 / files.length,
        });

        try {
          const content = await readFileContent(files[i]);
          const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
          const relativePath = files[i].fsPath.replace(workspaceFolder + '/', '');
          const fileResults = scanText(content, relativePath, config.patterns);
          allResults.push(...fileResults);
        } catch {
          // Skip files that can't be read
        }
      }

      return allResults;
    },
  );

  if (results.length === 0) {
    vscode.window.showInformationMessage('No TODO comments found in workspace.');
  } else {
    const unlinked = results.filter((r) => !r.linkedIssue);
    const linked = results.filter((r) => r.linkedIssue);
    vscode.window.showInformationMessage(
      `Found ${results.length} TODO comments: ${unlinked.length} unlinked, ${linked.length} linked.`,
    );
  }

  return results;
}

async function readFileContent(uri: vscode.Uri): Promise<string> {
  const data = await vscode.workspace.fs.readFile(uri);
  return new TextDecoder().decode(data);
}
