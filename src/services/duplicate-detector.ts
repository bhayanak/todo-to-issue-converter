import { IssueAdapter, IssueCreateResult } from '../models/issue-config';

export class DuplicateDetector {
  private adapter: IssueAdapter;

  constructor(adapter: IssueAdapter) {
    this.adapter = adapter;
  }

  async findDuplicates(todoText: string, filePath: string): Promise<IssueCreateResult[]> {
    if (!todoText || todoText.trim().length < 5) {
      return [];
    }

    return this.adapter.searchDuplicates(todoText, filePath);
  }

  calculateSimilarity(a: string, b: string): number {
    const aLower = a.toLowerCase().trim();
    const bLower = b.toLowerCase().trim();

    if (aLower === bLower) {
      return 1.0;
    }

    if (aLower.length === 0 || bLower.length === 0) {
      return 0;
    }

    // Simple word overlap similarity
    const aWords = new Set(aLower.split(/\s+/));
    const bWords = new Set(bLower.split(/\s+/));
    const intersection = new Set([...aWords].filter((w) => bWords.has(w)));
    const union = new Set([...aWords, ...bWords]);

    return intersection.size / union.size;
  }

  filterRelevant(
    duplicates: IssueCreateResult[],
    todoText: string,
    threshold = 0.3,
  ): IssueCreateResult[] {
    return duplicates.filter((dup) => {
      const similarity = this.calculateSimilarity(todoText, dup.title);
      return similarity >= threshold;
    });
  }
}
