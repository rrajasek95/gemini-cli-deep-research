import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

export class FileUploader {
  constructor(private client: GoogleGenAI) {}

  private determineMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.ts':
      case '.js':
      case '.py':
      case '.txt':
      case '.toml':
      case '.yaml':
      case '.yml':
        return 'text/plain';
      case '.json':
        return 'application/json';
      case '.md':
        return 'text/markdown';
      case '.html':
        return 'text/html';
      case '.pdf':
        return 'application/pdf';
      default:
        return 'text/plain';
    }
  }

  async uploadFile(filePath: string, storeName: string, config?: { chunkingConfig?: any }) {
    const fileName = path.basename(filePath);
    const mimeType = this.determineMimeType(filePath);

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
      return op;
    } catch (error: any) {
      console.error(`Failed to upload ${fileName}:`, error.message, error);
      throw new Error(`Failed to upload ${fileName} to ${storeName}: ${JSON.stringify(error)}`);
    }
  }

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
      // Skip hidden files/directories (starting with .)
      if (path.basename(filePath).startsWith('.')) continue;
      
      try {
        const op = await this.uploadFile(filePath, storeName, config);
        operations.push(op);
      } catch (error) {
        console.error(error);
        // Continue with other files
      }
    }
    return operations;
  }
}
