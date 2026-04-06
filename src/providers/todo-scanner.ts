import { TodoScanResult } from '../models/issue-config';

export interface ScanOptions {
  patterns: string[];
}

const COMMENT_PREFIXES = [
  '//', // C, C++, Java, JS, TS, Go, Rust, etc.
  '#', // Python, Ruby, Shell, YAML, etc.
  '--', // SQL, Haskell, Lua
  '%', // LaTeX, Erlang
  ';', // Lisp, Clojure, Assembly
  '<!--', // HTML, XML (simplified)
  '/*', // Block comments start (C-style)
  '*', // Inside block comments
];

export function buildTodoRegex(patterns: string[]): RegExp {
  const escaped = patterns.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const patternGroup = escaped.join('|');
  // Match: optional comment prefix, then TODO/FIXME/etc, optional colon, then the text
  return new RegExp(`\\b(${patternGroup})\\b[:\\s]?\\s*(.*)`, 'i');
}

export function scanLine(
  line: string,
  lineNumber: number,
  filePath: string,
  patterns: string[],
): TodoScanResult | null {
  const regex = buildTodoRegex(patterns);
  const match = line.match(regex);

  if (!match) {
    return null;
  }

  const type = match[1].toUpperCase();
  const text = match[2]?.trim() || '';

  // Check if the match is inside a comment by verifying a comment prefix exists before the match
  const matchIndex = line.indexOf(match[0]);
  const beforeMatch = line.substring(0, matchIndex).trim();

  const isInComment =
    COMMENT_PREFIXES.some((prefix) => beforeMatch.endsWith(prefix)) ||
    COMMENT_PREFIXES.some((prefix) => beforeMatch.startsWith(prefix)) ||
    beforeMatch === '' ||
    beforeMatch.endsWith('*');

  // Also accept if the TODO keyword appears after a comment prefix anywhere on the line
  const isInLineComment = COMMENT_PREFIXES.some((prefix) => {
    const prefixIndex = line.indexOf(prefix);
    return prefixIndex !== -1 && prefixIndex < matchIndex;
  });

  if (!isInComment && !isInLineComment) {
    return null;
  }

  // Check if an issue is already linked (e.g., "TODO(PROJ-123): ..." or "TODO [#456]: ...")
  const linkedIssueMatch = text.match(/^\(?([A-Z]+-\d+|#\d+)\)?[:\s]/);
  const linkedIssue = linkedIssueMatch ? linkedIssueMatch[1] : undefined;

  return {
    type,
    text: linkedIssue ? text.replace(linkedIssueMatch![0], '').trim() : text,
    file: filePath,
    line: lineNumber,
    linkedIssue,
  };
}

export function scanText(content: string, filePath: string, patterns: string[]): TodoScanResult[] {
  const lines = content.split('\n');
  const results: TodoScanResult[] = [];

  for (let i = 0; i < lines.length; i++) {
    const result = scanLine(lines[i], i + 1, filePath, patterns);
    if (result) {
      results.push(result);
    }
  }

  return results;
}
