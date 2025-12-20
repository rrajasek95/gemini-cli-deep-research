import fs from 'fs';
import path from 'path';
import { WorkspaceConfigManager, WorkspaceConfig } from './WorkspaceConfig';

jest.mock('fs');

describe('WorkspaceConfigManager', () => {
  const mockConfigPath = path.resolve(process.cwd(), '.gemini-research.json');
  const mockConfig: WorkspaceConfig = {
    researchIds: ['research-123'],
    fileSearchStores: {
      'my-store': 'stores/store-456',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load existing config', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));

    const config = WorkspaceConfigManager.load();
    expect(config).toEqual(mockConfig);
    expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
  });

  it('should return default config if file does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const config = WorkspaceConfigManager.load();
    expect(config).toEqual({ researchIds: [], fileSearchStores: {} });
  });

  it('should save config', () => {
    WorkspaceConfigManager.save(mockConfig);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockConfigPath,
      JSON.stringify(mockConfig, null, 2)
    );
  });

  it('should add a research ID', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ researchIds: [], fileSearchStores: {} }));
    
    WorkspaceConfigManager.addResearchId('new-id');
    
    expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        expect.stringContaining('"researchIds": [\n    "new-id"\n  ]')
    );
  });

    it('should add a file search store', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ researchIds: [], fileSearchStores: {} }));
    
    WorkspaceConfigManager.addFileSearchStore('new-store', 'stores/123');
    
    expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        expect.stringContaining('"new-store": "stores/123"')
    );
  });
});
