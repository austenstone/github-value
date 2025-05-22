class DuplicateService {
  private processed = new Set<string>();
  private queue: string[] = [];
  private readonly maxEntries = 50;

  async isDuplicate(id: string) {
    return this.processed.has(id);
  }

  async register(id: string) {
    if (!this.processed.has(id)) {
      this.processed.add(id);
      this.queue.push(id);
      if (this.queue.length > this.maxEntries) {
        const oldest = this.queue.shift()!;
        this.processed.delete(oldest);
      }
    }
  }
}
export default new DuplicateService();
