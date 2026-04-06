import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as childProcess from 'child_process';
import {
  getGitBlame,
  getGitBranch,
  getGitRemoteUrl,
  getGitCommitSha,
} from '../src/utils/git-utils';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

const mockExecSync = vi.mocked(childProcess.execSync);

describe('getGitBlame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse git blame porcelain output', () => {
    mockExecSync.mockReturnValue(
      `abc123def456 42 42 1
author Jane Doe
author-mail <jane@example.com>
author-time 1705312200
author-tz +0000
committer Jane Doe
summary Some commit message
filename src/test.ts
\t// TODO: fix this`,
    );

    const result = getGitBlame('/workspace/src/test.ts', 42);
    expect(result).not.toBeNull();
    expect(result!.author).toBe('Jane Doe');
    expect(result!.email).toBe('jane@example.com');
    expect(result!.commit).toBe('abc123def456');
    expect(result!.date).toBeTruthy();
  });

  it('should return null on git error', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('not a git repository');
    });

    const result = getGitBlame('/not-a-repo/file.ts', 1);
    expect(result).toBeNull();
  });

  it('should handle missing author fields gracefully', () => {
    mockExecSync.mockReturnValue(`abc123 42 42 1\nfilename test.ts`);

    const result = getGitBlame('/workspace/test.ts', 42);
    expect(result).not.toBeNull();
    expect(result!.author).toBe('Unknown');
    expect(result!.commit).toBe('abc123');
  });

  it('should remove angle brackets from email', () => {
    mockExecSync.mockReturnValue(
      `abc123 1 1 1
author Test
author-mail <test@test.com>
author-time 1700000000`,
    );

    const result = getGitBlame('/test.ts', 1);
    expect(result!.email).toBe('test@test.com');
    expect(result!.email).not.toContain('<');
    expect(result!.email).not.toContain('>');
  });

  it('should handle empty timestamp', () => {
    mockExecSync.mockReturnValue(`abc123 1 1 1\nauthor Test`);

    const result = getGitBlame('/test.ts', 1);
    expect(result!.date).toBe('');
  });
});

describe('getGitBranch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return current branch name', () => {
    mockExecSync.mockReturnValue('feature/my-branch\n');

    const result = getGitBranch('/workspace');
    expect(result).toBe('feature/my-branch');
  });

  it('should return null on error', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('not a git repository');
    });

    const result = getGitBranch('/not-a-repo');
    expect(result).toBeNull();
  });

  it('should trim whitespace', () => {
    mockExecSync.mockReturnValue('  main  \n');

    const result = getGitBranch('/workspace');
    expect(result).toBe('main');
  });
});

describe('getGitRemoteUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return normalized remote URL', () => {
    mockExecSync.mockReturnValue('https://github.com/owner/repo.git\n');

    const result = getGitRemoteUrl('/workspace');
    expect(result).toBe('https://github.com/owner/repo');
  });

  it('should handle SSH URLs', () => {
    mockExecSync.mockReturnValue('git@github.com:owner/repo.git\n');

    const result = getGitRemoteUrl('/workspace');
    expect(result).toBe('https://github.com/owner/repo');
  });

  it('should return null on error', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('no remote');
    });

    const result = getGitRemoteUrl('/workspace');
    expect(result).toBeNull();
  });
});

describe('getGitCommitSha', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return commit SHA', () => {
    mockExecSync.mockReturnValue('abc123def456789\n');

    const result = getGitCommitSha('/workspace');
    expect(result).toBe('abc123def456789');
  });

  it('should return null on error', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('not a git repo');
    });

    const result = getGitCommitSha('/workspace');
    expect(result).toBeNull();
  });
});
