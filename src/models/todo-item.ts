export interface TodoContext {
  filePath: string;
  absolutePath: string;
  lineNumber: number;
  todoType: string;
  todoText: string;
  language: string;
  surroundingCode: string;
  gitBlame: GitBlameInfo | null;
  gitBranch: string | null;
  repoUrl: string | null;
  codePermalink: string | null;
}

export interface GitBlameInfo {
  author: string;
  email: string;
  date: string;
  commit: string;
}
