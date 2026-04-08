import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeGitUrl, buildCodePermalink, parseOwnerRepoFromUrl } from '../src/utils/git-utils';

// Note: getGitBlame, getGitBranch, getGitRemoteUrl, getGitCommitSha use execSync
// and are tested via integration or by mocking child_process module

describe('normalizeGitUrl', () => {
  it('should convert SSH URL to HTTPS', () => {
    const result = normalizeGitUrl('git@github.com:owner/repo.git');
    expect(result).toBe('https://github.com/owner/repo');
  });

  it('should remove .git suffix from HTTPS URL', () => {
    const result = normalizeGitUrl('https://github.com/owner/repo.git');
    expect(result).toBe('https://github.com/owner/repo');
  });

  it('should handle HTTPS URL without .git', () => {
    const result = normalizeGitUrl('https://github.com/owner/repo');
    expect(result).toBe('https://github.com/owner/repo');
  });

  it('should trim whitespace', () => {
    const result = normalizeGitUrl('  https://github.com/owner/repo  ');
    expect(result).toBe('https://github.com/owner/repo');
  });

  it('should handle GitLab SSH URL', () => {
    const result = normalizeGitUrl('git@gitlab.com:group/subgroup/repo.git');
    expect(result).toBe('https://gitlab.com/group/subgroup/repo');
  });

  it('should handle Bitbucket SSH URL', () => {
    const result = normalizeGitUrl('git@bitbucket.org:team/repo.git');
    expect(result).toBe('https://bitbucket.org/team/repo');
  });
});

describe('buildCodePermalink', () => {
  it('should build a permalink with all components', () => {
    const result = buildCodePermalink(
      'https://github.com/owner/repo',
      'abc123def',
      'src/main.ts',
      42,
    );
    expect(result).toBe('https://github.com/owner/repo/blob/abc123def/src/main.ts#L42');
  });

  it('should return null when repoUrl is null', () => {
    const result = buildCodePermalink(null, 'abc123', 'src/main.ts', 42);
    expect(result).toBeNull();
  });

  it('should return null when commitSha is null', () => {
    const result = buildCodePermalink('https://github.com/owner/repo', null, 'src/main.ts', 42);
    expect(result).toBeNull();
  });

  it('should handle line number 1', () => {
    const result = buildCodePermalink('https://github.com/owner/repo', 'abc123', 'README.md', 1);
    expect(result).toBe('https://github.com/owner/repo/blob/abc123/README.md#L1');
  });

  it('should handle nested file paths', () => {
    const result = buildCodePermalink(
      'https://github.com/owner/repo',
      'abc123',
      'src/deep/nested/file.ts',
      100,
    );
    expect(result).toContain('src/deep/nested/file.ts#L100');
  });
});

describe('parseOwnerRepoFromUrl', () => {
  it('should parse HTTPS GitHub URL', () => {
    const result = parseOwnerRepoFromUrl('https://github.com/myowner/myrepo');
    expect(result).toEqual({ owner: 'myowner', repo: 'myrepo' });
  });

  it('should parse HTTPS URL with .git suffix', () => {
    const result = parseOwnerRepoFromUrl('https://github.com/owner/repo.git');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('should parse SSH URL', () => {
    const result = parseOwnerRepoFromUrl('git@github.com:owner/repo.git');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('should parse SSH URL without .git suffix', () => {
    const result = parseOwnerRepoFromUrl('git@github.com:owner/repo');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  it('should handle GitLab URLs with subgroups by returning last two path segments', () => {
    const result = parseOwnerRepoFromUrl('https://gitlab.com/group/subgroup/repo');
    expect(result).toEqual({ owner: 'subgroup', repo: 'repo' });
  });

  it('should return null for invalid URL', () => {
    const result = parseOwnerRepoFromUrl('not-a-url');
    expect(result).toBeNull();
  });

  it('should return null for URL with no path segments', () => {
    const result = parseOwnerRepoFromUrl('https://github.com/');
    expect(result).toBeNull();
  });
});
