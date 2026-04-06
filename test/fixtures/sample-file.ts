// Sample TypeScript file with various TODO patterns for testing
import { SomeService } from './some-service';

export class UserController {
  private service: SomeService;

  constructor() {
    // TODO: Inject service via DI container
    this.service = new SomeService();
  }

  async getUser(id: string) {
    // FIXME: Add proper input validation
    if (!id) {
      throw new Error('ID required');
    }

    // HACK: Temporary workaround for API rate limiting
    await this.delay(100);

    return this.service.findUser(id);
  }

  async deleteUser(id: string) {
    // BUG: This doesn't cascade delete related records
    return this.service.deleteUser(id);
  }

  // XXX: This method needs complete rewrite
  async updateUser(id: string, data: unknown) {
    return this.service.updateUser(id, data);
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
