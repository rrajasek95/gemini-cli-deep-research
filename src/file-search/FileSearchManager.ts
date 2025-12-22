import { GoogleGenAI } from '@google/genai';

export class FileSearchManager {
  constructor(private client: GoogleGenAI) {}

  async createStore(displayName: string) {
    return await this.client.fileSearchStores.create({
      config: {
        displayName,
      },
    });
  }

  async listStores() {
    return await this.client.fileSearchStores.list();
  }

  async getStore(name: string) {
    return await this.client.fileSearchStores.get({ name });
  }

  async deleteStore(name: string, force: boolean = false) {
    return await this.client.fileSearchStores.delete({ name, config: { force } });
  }

  async queryStore(storeName: string, query: string, model: string = 'gemini-2.5-flash'): Promise<any> {
    return await this.client.interactions.create({
      model: model,
      input: query,
      tools: [
        {
          // @ts-ignore
          type: 'file_search',
          file_search_store_names: [storeName],
        } as any,
      ],
    });
  }

  /**
   * Lists all documents in a file search store.
   * Handles pagination automatically to retrieve all documents.
   */
  async listDocuments(storeName: string): Promise<any[]> {
    const allDocuments: any[] = [];
    const pager = await this.client.fileSearchStores.documents.list({
      parent: storeName,
      config: { pageSize: 100 },
    });

    // Iterate through all pages
    for await (const document of pager) {
      allDocuments.push(document);
    }

    return allDocuments;
  }

  /**
   * Gets a single document by name.
   */
  async getDocument(documentName: string): Promise<any> {
    return await this.client.fileSearchStores.documents.get({ name: documentName });
  }

  /**
   * Deletes a document from a file search store.
   */
  async deleteDocument(documentName: string): Promise<void> {
    await this.client.fileSearchStores.documents.delete({ name: documentName });
  }
}