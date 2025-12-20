import { FileSearchManager } from './FileSearchManager';
import { GoogleGenAI } from '@google/genai';

jest.mock('@google/genai');

describe('FileSearchManager', () => {
  let mockGenAI: jest.Mocked<GoogleGenAI>;
  let manager: FileSearchManager;

  beforeEach(() => {
    mockGenAI = new GoogleGenAI({ apiKey: 'test-key' }) as jest.Mocked<GoogleGenAI>;
    manager = new FileSearchManager(mockGenAI);
  });

  it('should create a file search store', async () => {
    const mockStore = { name: 'fileSearchStores/my-store' };
    (mockGenAI.fileSearchStores.create as jest.Mock).mockResolvedValue(mockStore);

    const result = await manager.createStore('my-store');
    
    expect(mockGenAI.fileSearchStores.create).toHaveBeenCalledWith({
      fileSearchStore: {
        displayName: 'my-store',
      },
    });
    expect(result).toEqual(mockStore);
  });

  it('should list file search stores', async () => {
    const mockStores = [
      { name: 'fileSearchStores/store-1', displayName: 'Store 1' },
      { name: 'fileSearchStores/store-2', displayName: 'Store 2' },
    ];
    // Mocking a pager-like response if it's paged, or just an array
    (mockGenAI.fileSearchStores.list as jest.Mock).mockResolvedValue(mockStores);

    const result = await manager.listStores();
    
    expect(mockGenAI.fileSearchStores.list).toHaveBeenCalled();
    expect(result).toEqual(mockStores);
  });

  it('should delete a file search store', async () => {
    (mockGenAI.fileSearchStores.delete as jest.Mock).mockResolvedValue({});

    await manager.deleteStore('fileSearchStores/my-store');
    
    expect(mockGenAI.fileSearchStores.delete).toHaveBeenCalledWith('fileSearchStores/my-store');
  });
});
