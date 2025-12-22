import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  getMimeTypeWithFallback,
  FILE_SIZE_LIMITS,
  UnsupportedFileTypeError,
  FileSizeExceededError,
  FileUploadError,
  ProgressCallback,
} from './mimeTypes';

export class FileUploader {
  constructor(private client: GoogleGenAI) {}

  private determineMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const result = getMimeTypeWithFallback(filePath);

    if (!result) {
      throw new UnsupportedFileTypeError(filePath, ext);
    }

    return result.mimeType;
  }

  private validateFileSize(filePath: string, stats: fs.Stats): void {
    if (stats.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE_BYTES) {
      throw new FileSizeExceededError(
        filePath,
        stats.size,
        FILE_SIZE_LIMITS.MAX_FILE_SIZE_BYTES
      );
    }
  }

  private getFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  async uploadFile(
    filePath: string,
    storeName: string,
    config?: {
      chunkingConfig?: any;
      relativePath?: string;
      onProgress?: ProgressCallback;
    }
  ): Promise<any> {
    const fileName = path.basename(filePath);
    const stats = fs.statSync(filePath);

    // Validate size BEFORE expensive hashing operation
    this.validateFileSize(filePath, stats);

    // Validate MIME type (will throw if unsupported)
    const mimeType = this.determineMimeType(filePath);

    // Now proceed with hashing
    const hash = this.getFileHash(filePath);
    const lastModified = stats.mtime.toISOString();
    const relativePath = config?.relativePath || fileName;

    try {
      // Emit progress event if callback provided
      config?.onProgress?.({
        type: 'file_start',
        currentFile: fileName,
      });

      console.error(`Uploading ${fileName} to ${storeName} with metadata (path: ${relativePath})...`);
      const op = await this.client.fileSearchStores.uploadToFileSearchStore({
        fileSearchStoreName: storeName,
        file: filePath,
        config: {
          displayName: fileName,
          mimeType,
          chunkingConfig: config?.chunkingConfig,
          metadata: {
            path: relativePath,
            hash: hash,
            last_modified: lastModified,
          }
        } as any,
      });

      // Emit complete event
      config?.onProgress?.({
        type: 'file_complete',
        currentFile: fileName,
      });

      return op;
    } catch (error: any) {
      console.error(`Failed to upload ${fileName}:`, error.message);

      // Emit error event
      config?.onProgress?.({
        type: 'file_error',
        currentFile: fileName,
        error,
      });

      throw new FileUploadError(filePath, error);
    }
  }

  async uploadDirectory(
    dirPath: string,
    storeName: string,
    config?: {
      chunkingConfig?: any;
      onProgress?: ProgressCallback;
      parallel?: { maxConcurrent?: number };
    }
  ): Promise<any[]> {
    const absoluteDirPath = path.resolve(dirPath);
    const maxConcurrent = config?.parallel?.maxConcurrent ?? 5;

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

    const allFiles = getFiles(absoluteDirPath)
      .filter(f => !path.basename(f).startsWith('.')); // Skip hidden files

    // Emit start event
    config?.onProgress?.({
      type: 'start',
      totalFiles: allFiles.length,
      percentage: 0,
    });

    const results: any[] = [];
    let completedFiles = 0;
    let failedFiles = 0;

    // Process files in batches of maxConcurrent
    for (let i = 0; i < allFiles.length; i += maxConcurrent) {
      const batch = allFiles.slice(i, i + maxConcurrent);

      // Use Promise.allSettled to continue on failures
      const batchResults = await Promise.allSettled(
        batch.map((filePath, idx) => {
          const relativePath = path.relative(absoluteDirPath, filePath);
          const fileIndex = i + idx + 1;

          return this.uploadFile(filePath, storeName, {
            ...config,
            relativePath,
            onProgress: (event) => {
              // Augment progress events with batch context
              const augmentedEvent = {
                ...event,
                currentFileIndex: fileIndex,
                totalFiles: allFiles.length,
                completedFiles,
                percentage: Math.round((completedFiles / allFiles.length) * 100),
              };
              config?.onProgress?.(augmentedEvent);
            },
          });
        })
      );

      // Track results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          completedFiles++;
        } else {
          console.error('Upload failed:', result.reason);
          failedFiles++;
        }
      }
    }

    // Emit complete event
    config?.onProgress?.({
      type: 'complete',
      totalFiles: allFiles.length,
      completedFiles,
      failedFiles,
      percentage: 100,
    });

    return results;
  }
}
