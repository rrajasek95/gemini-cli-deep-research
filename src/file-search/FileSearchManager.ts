import { GoogleGenAI } from '@google/genai';

export class FileSearchManager {
  constructor(private client: GoogleGenAI) {}

  async createStore(displayName: string) {
    return await this.client.fileSearchStores.create({
      fileSearchStore: {
        displayName,
      },
    });
  }

  async listStores() {
    return await this.client.fileSearchStores.list();
  }

  async getStore(name: string) {
    return await this.client.fileSearchStores.get(name);
  }

  async deleteStore(name: string, force: boolean = false) {
    return await this.client.fileSearchStores.delete(name, force ? { config: { force } } : undefined);
  }
}
