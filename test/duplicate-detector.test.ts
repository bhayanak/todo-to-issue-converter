import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DuplicateDetector } from '../src/services/duplicate-detector';
import { IssueAdapter, IssueCreateResult } from '../src/models/issue-config';
import { TodoContext } from '../src/models/todo-item';

function createMockAdapter(duplicates: IssueCreateResult[] = []): IssueAdapter {
  return {
    createIssue: vi.fn().mockResolvedValue({
      provider: 'jira',
      key: 'TEST-1',
      url: 'https://test.atlassian.net/browse/TEST-1',
      title: 'Test Issue',
    }),
    searchDuplicates: vi.fn().mockResolvedValue(duplicates),
    getIssueStatus: vi.fn().mockResolvedValue('Open'),
  };
}

describe('DuplicateDetector', () => {
  describe('findDuplicates', () => {
    it('should search for duplicates using adapter', async () => {
      const mockDuplicates: IssueCreateResult[] = [
        {
          provider: 'jira',
          key: 'PROJ-100',
          url: 'https://test.atlassian.net/browse/PROJ-100',
          title: 'Fix authentication middleware',
        },
      ];
      const adapter = createMockAdapter(mockDuplicates);
      const detector = new DuplicateDetector(adapter);

      const results = await detector.findDuplicates('Fix authentication', 'src/auth.ts');
      expect(results.length).toBe(1);
      expect(results[0].key).toBe('PROJ-100');
      expect(adapter.searchDuplicates).toHaveBeenCalledWith('Fix authentication', 'src/auth.ts');
    });

    it('should return empty array for short text', async () => {
      const adapter = createMockAdapter();
      const detector = new DuplicateDetector(adapter);

      const results = await detector.findDuplicates('fix', 'src/auth.ts');
      expect(results.length).toBe(0);
      expect(adapter.searchDuplicates).not.toHaveBeenCalled();
    });

    it('should return empty array for empty text', async () => {
      const adapter = createMockAdapter();
      const detector = new DuplicateDetector(adapter);

      const results = await detector.findDuplicates('', 'src/auth.ts');
      expect(results.length).toBe(0);
    });

    it('should return empty array for whitespace-only text', async () => {
      const adapter = createMockAdapter();
      const detector = new DuplicateDetector(adapter);

      const results = await detector.findDuplicates('   ', 'src/auth.ts');
      expect(results.length).toBe(0);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1.0 for identical strings', () => {
      const adapter = createMockAdapter();
      const detector = new DuplicateDetector(adapter);

      expect(detector.calculateSimilarity('hello world', 'hello world')).toBe(1.0);
    });

    it('should return 1.0 for case-insensitive matches', () => {
      const adapter = createMockAdapter();
      const detector = new DuplicateDetector(adapter);

      expect(detector.calculateSimilarity('Hello World', 'hello world')).toBe(1.0);
    });

    it('should return 0 for completely different strings', () => {
      const adapter = createMockAdapter();
      const detector = new DuplicateDetector(adapter);

      expect(detector.calculateSimilarity('hello', 'xyz')).toBe(0);
    });

    it('should return 0 for empty strings', () => {
      const adapter = createMockAdapter();
      const detector = new DuplicateDetector(adapter);

      expect(detector.calculateSimilarity('', 'hello')).toBe(0);
      expect(detector.calculateSimilarity('hello', '')).toBe(0);
    });

    it('should return partial similarity for overlapping words', () => {
      const adapter = createMockAdapter();
      const detector = new DuplicateDetector(adapter);

      const similarity = detector.calculateSimilarity(
        'fix authentication middleware',
        'refactor authentication service',
      );
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });
  });

  describe('filterRelevant', () => {
    it('should filter duplicates by similarity threshold', () => {
      const adapter = createMockAdapter();
      const detector = new DuplicateDetector(adapter);

      const duplicates: IssueCreateResult[] = [
        { provider: 'jira', key: 'P-1', url: '', title: 'fix authentication middleware' },
        { provider: 'jira', key: 'P-2', url: '', title: 'update readme documentation' },
        { provider: 'jira', key: 'P-3', url: '', title: 'fix middleware authentication flow' },
      ];

      const relevant = detector.filterRelevant(duplicates, 'fix authentication middleware');
      expect(relevant.length).toBeGreaterThanOrEqual(1);
      expect(relevant.some((d) => d.key === 'P-1')).toBe(true);
    });

    it('should return empty array when nothing matches threshold', () => {
      const adapter = createMockAdapter();
      const detector = new DuplicateDetector(adapter);

      const duplicates: IssueCreateResult[] = [
        { provider: 'jira', key: 'P-1', url: '', title: 'completely unrelated topic' },
      ];

      const relevant = detector.filterRelevant(duplicates, 'fix authentication middleware', 0.9);
      expect(relevant.length).toBe(0);
    });

    it('should use default threshold of 0.3', () => {
      const adapter = createMockAdapter();
      const detector = new DuplicateDetector(adapter);

      const duplicates: IssueCreateResult[] = [
        { provider: 'jira', key: 'P-1', url: '', title: 'fix login authentication' },
      ];

      const relevant = detector.filterRelevant(duplicates, 'fix authentication');
      expect(relevant.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty duplicates array', () => {
      const adapter = createMockAdapter();
      const detector = new DuplicateDetector(adapter);

      const relevant = detector.filterRelevant([], 'fix authentication');
      expect(relevant.length).toBe(0);
    });
  });
});
