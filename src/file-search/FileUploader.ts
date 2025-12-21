import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

export class FileUploader {
  constructor(private client: GoogleGenAI) {}

  async uploadDirectory(dirPath: string, storeName: string, config?: { chunkingConfig?: any }) {
    const getFiles = (dir: string): string[] => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        const res = path.resolve(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...getFiles(res));
        } else {
          files.push(res);
        }
      }
      return files;
    };

    const files = getFiles(dirPath);

    const operations = [];
    for (const filePath of files) {
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();
      let mimeType = 'text/plain';
      if (ext === '.ts') mimeType = 'text/plain';
      if (ext === '.json') mimeType = 'application/json';
      if (ext === '.md') mimeType = 'text/markdown';
      
      try {
        console.error(`Uploading ${fileName} to ${storeName} with mimeType ${mimeType}...`);
        const op = await this.client.fileSearchStores.uploadToFileSearchStore({
          fileSearchStoreName: storeName,
          file: filePath,
          config: {
            displayName: fileName,
            mimeType,
            ...config,
          },
        });
        operations.push(op);
      } catch (error: any) {
        console.error(`Failed to upload ${fileName}:`, error.message, error);
        // Continue with other files or throw? 
        // For a bulk tool, maybe we want to report failures but try others.
        // But if the store name is wrong, all will fail.
        // Let's rethrow for now to see the error, but with more context.
        throw new Error(`Failed to upload ${fileName} to ${storeName}: ${JSON.stringify(error)}`);
      }
    }
    return operations;
  }
}
