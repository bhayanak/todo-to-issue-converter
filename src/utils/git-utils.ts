import { execSync } from 'child_process';
import { GitBlameInfo } from '../models/todo-item';

export function getGitBlame(absolutePath: string, lineNumber: number): GitBlameInfo | null {
  try {
    const output = execSync(
      `git blame -L ${lineNumber},${lineNumber} --porcelain "${absolutePath}"`,
      { encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] },
    );

    const author = extractField(output, 'author') || 'Unknown';
    const email = extractField(output, 'author-mail') || '';
    const timestamp = extractField(output, 'author-time') || '';
    const commit = output.split('\n')[0]?.split(' ')[0] || '';

    const date = timestamp ? new Date(parseInt(timestamp, 10) * 1000).toISOString() : '';

    return {
      author,
      email: email.replace(/[<>]/g, ''),
      date,
      commit,
    };
  } catch {
    return null;
  }
}

export function getGitBranch(cwd: string): string | null {
  if (!cwd) return null;
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
      cwd,
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

export function getGitRemoteUrl(cwd: string): string | null {
  if (!cwd) return null;
  try {
    const raw = execSync('git remote get-url origin', {
      encoding: 'utf-8',
      cwd,
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return normalizeGitUrl(raw);
  } catch {
    return null;
  }
}

export function getGitCommitSha(cwd: string): string | null {
  if (!cwd) return null;
  try {
    return execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
      cwd,
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

export function buildCodePermalink(
  repoUrl: string | null,
  commitSha: string | null,
  filePath: string,
  lineNumber: number,
): string | null {
  if (!repoUrl || !commitSha) {
    return null;
  }
  return `${repoUrl}/blob/${commitSha}/${filePath}#L${lineNumber}`;
}

function extractField(porcelainOutput: string, fieldName: string): string | null {
  const regex = new RegExp(`^${fieldName} (.+)$`, 'm');
  const match = porcelainOutput.match(regex);
  return match ? match[1].trim() : null;
}

export function parseOwnerRepoFromUrl(repoUrl: string): { owner: string; repo: string } | null {
  // Handle SSH format: git@host:owner/repo.git
  const sshMatch = repoUrl.match(/^git@[^:]+:(.+?)(?:\.git)?$/);
  if (sshMatch) {
    const parts = sshMatch[1].split('/');
    if (parts.length >= 2) {
      return { owner: parts[parts.length - 2], repo: parts[parts.length - 1] };
    }
  }
  try {
    const url = new URL(repoUrl);
    const parts = url.pathname
      .replace(/^\//, '')
      .replace(/\.git$/, '')
      .split('/');
    if (parts.length >= 2) {
      return { owner: parts[parts.length - 2], repo: parts[parts.length - 1] };
    }
  } catch {
    // not a valid URL
  }
  return null;
}

export function normalizeGitUrl(raw: string): string {
  let url = raw.trim();
  // SSH format: git@github.com:owner/repo.git
  if (url.startsWith('git@')) {
    url = url.replace(/^git@([^:]+):(.+)$/, 'https://$1/$2');
  }
  // Remove .git suffix
  if (url.endsWith('.git')) {
    url = url.slice(0, -4);
  }
  return url;
}
