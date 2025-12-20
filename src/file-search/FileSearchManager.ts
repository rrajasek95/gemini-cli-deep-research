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

  async deleteStore(name: string) {
    return await this.client.fileSearchStores.delete(name);
  }
}
