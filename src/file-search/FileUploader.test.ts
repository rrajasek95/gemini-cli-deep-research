import fs from 'fs';
import { FileUploader } from './FileUploader';
import { GoogleGenAI } from '@google/genai';

jest.mock('fs');
jest.mock('@google/genai');

describe('FileUploader', () => {
  let mockGenAI: jest.Mocked<GoogleGenAI>;
  let uploader: FileUploader;

  beforeEach(() => {
    mockGenAI = {
      files: {
        upload: jest.fn(),
      },
      fileSearchStores: {
        uploadToFileSearchStore: jest.fn(),
      },
    } as unknown as jest.Mocked<GoogleGenAI>;
    uploader = new FileUploader(mockGenAI);
    jest.clearAllMocks();
  });

  it('should scan a directory and upload files', async () => {
    // Mock for the top-level directory
    (fs.readdirSync as jest.Mock).mockReturnValue([
      { name: 'file1.txt', isFile: () => true, isDirectory: () => false },
      { name: 'file2.pdf', isFile: () => true, isDirectory: () => false },
    ]);
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('content'));
    (fs.statSync as jest.Mock).mockReturnValue({ mtime: new Date('2025-01-01T00:00:00Z') });

    (mockGenAI.fileSearchStores.uploadToFileSearchStore as jest.Mock)
      .mockResolvedValueOnce({ name: 'operations/1' })
      .mockResolvedValueOnce({ name: 'operations/2' });

    const result = await uploader.uploadDirectory('my-dir', 'fileSearchStores/my-store');

    expect(fs.readdirSync).toHaveBeenCalledWith(expect.any(String), { withFileTypes: true });
    expect(mockGenAI.fileSearchStores.uploadToFileSearchStore).toHaveBeenCalledTimes(2);
    expect(mockGenAI.fileSearchStores.uploadToFileSearchStore).toHaveBeenCalledWith(
        expect.objectContaining({
            config: expect.objectContaining({
                metadata: expect.objectContaining({
                    path: 'file1.txt',
                    hash: expect.any(String),
                    last_modified: '2025-01-01T00:00:00.000Z'
                })
            })
        })
    );
  });

  it('should upload a single file', async () => {
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('content'));
    (fs.statSync as jest.Mock).mockReturnValue({ mtime: new Date('2025-01-01T00:00:00Z') });
    (mockGenAI.fileSearchStores.uploadToFileSearchStore as jest.Mock)
      .mockResolvedValueOnce({ name: 'operations/1' });

    const result = await uploader.uploadFile('path/to/file.txt', 'fileSearchStores/my-store');

    expect(mockGenAI.fileSearchStores.uploadToFileSearchStore).toHaveBeenCalledWith(
        expect.objectContaining({
            fileSearchStoreName: 'fileSearchStores/my-store',
            file: 'path/to/file.txt',
            config: expect.objectContaining({
                displayName: 'file.txt',
                mimeType: 'text/plain',
                metadata: {
                    path: 'file.txt',
                    hash: 'ed7002b439e9ac845f22357d822bac1444730fbdb6016d3ec9432297b9ec9f73', // hash of 'content'
                    last_modified: '2025-01-01T00:00:00.000Z'
                }
            })
        })
    );
    expect(result).toEqual({ name: 'operations/1' });
  });

  it('should support optional chunkingConfig in uploadDirectory', async () => {
    (fs.readdirSync as jest.Mock).mockReturnValue([
      { name: 'file1.txt', isFile: () => true, isDirectory: () => false },
    ]);
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('content'));
    (fs.statSync as jest.Mock).mockReturnValue({ mtime: new Date('2025-01-01T00:00:00Z') });

    (mockGenAI.fileSearchStores.uploadToFileSearchStore as jest.Mock)
      .mockResolvedValueOnce({ name: 'operations/1' });

    const chunkingConfig = { whiteSpaceConfig: { maxTokensPerChunk: 100 } };
    await uploader.uploadDirectory('my-dir', 'fileSearchStores/my-store', { chunkingConfig });

    expect(mockGenAI.fileSearchStores.uploadToFileSearchStore).toHaveBeenCalledWith(
        expect.objectContaining({
            fileSearchStoreName: 'fileSearchStores/my-store',
            config: expect.objectContaining({ 
                chunkingConfig 
            })
        })
    );
  });

  it('should ignore non-supported file types if applicable', async () => {
      // For now let's assume it tries to upload everything and let the API handle it, 
      // or we can add a filter.
  });
});
