// Mock for the vscode module used in tests
export const workspace = {
  getConfiguration: (section?: string) => ({
    get: <T>(key: string, defaultValue?: T): T | undefined => {
      const defaults: Record<string, unknown> = {
        provider: 'jira',
        'jira.baseUrl': 'https://test.atlassian.net',
        'jira.projectKey': 'TEST',
        'jira.issueType': 'Task',
        'github.owner': 'test-owner',
        'github.repo': 'test-repo',
        patterns: ['TODO', 'FIXME', 'HACK', 'BUG', 'XXX'],
        contextLines: 5,
        includeGitBlame: true,
        autoLabel: true,
        showCodeLens: true,
        duplicateDetection: true,
      };
      return (defaults[key] as T) ?? defaultValue;
    },
    has: (key: string) => true,
    inspect: () => undefined,
    update: async () => {},
  }),
  workspaceFolders: [
    {
      uri: { fsPath: '/mock/workspace', scheme: 'file' },
      name: 'mock-workspace',
      index: 0,
    },
  ],
  findFiles: async () => [],
  fs: {
    readFile: async () => new Uint8Array(),
  },
};

export const window = {
  showInformationMessage: async (...args: unknown[]) => undefined,
  showWarningMessage: async (...args: unknown[]) => undefined,
  showErrorMessage: async (...args: unknown[]) => undefined,
  showQuickPick: async (items: unknown[]) => undefined,
  showInputBox: async () => undefined,
  activeTextEditor: undefined as unknown,
  withProgress: async (_options: unknown, task: (progress: unknown) => Promise<unknown>) => {
    return task({ report: () => {} });
  },
  createTextEditorDecorationType: (options: unknown) => ({
    dispose: () => {},
  }),
};

export const commands = {
  registerCommand: (command: string, callback: (...args: unknown[]) => unknown) => ({
    dispose: () => {},
  }),
  executeCommand: async () => undefined,
};

export const languages = {
  registerCodeLensProvider: (selector: unknown, provider: unknown) => ({
    dispose: () => {},
  }),
};

export const Uri = {
  file: (path: string) => ({ fsPath: path, scheme: 'file', path }),
  parse: (value: string) => ({ fsPath: value, scheme: 'file', path: value }),
};

export enum ProgressLocation {
  Notification = 15,
  SourceControl = 1,
  Window = 10,
}

export class Range {
  constructor(
    public startLine: number,
    public startCharacter: number,
    public endLine: number,
    public endCharacter: number,
  ) {}
}

export class Position {
  constructor(
    public line: number,
    public character: number,
  ) {}
}

export class CodeLens {
  constructor(
    public range: Range,
    public command?: unknown,
  ) {}
}

export enum TextEditorRevealType {
  Default = 0,
  InCenter = 1,
  InCenterIfOutsideViewport = 2,
  AtTop = 3,
}

export class EventEmitter {
  event = () => ({ dispose: () => {} });
  fire() {}
  dispose() {}
}

export const SecretStorage = {};
