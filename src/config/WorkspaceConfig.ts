import fs from 'fs';
import path from 'path';
import { z } from 'zod';

export const WorkspaceConfigSchema = z.object({
  researchIds: z.array(z.string()).default([]),
  fileSearchStores: z.record(z.string(), z.string()).default({}),
});

export type WorkspaceConfig = z.infer<typeof WorkspaceConfigSchema>;

export class WorkspaceConfigManager {
  private static configPath = path.resolve(process.cwd(), '.gemini-research.json');

  static load(): WorkspaceConfig {
    if (!fs.existsSync(this.configPath)) {
      const defaultConfig: WorkspaceConfig = { researchIds: [], fileSearchStores: {} };
      this.save(defaultConfig);
      return defaultConfig;
    }

    try {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(content);
      return WorkspaceConfigSchema.parse(parsed);
    } catch (error) {
      // In case of error (e.g. corrupted file), return default or throw?
      // For now, let's return default but maybe log warning?
      // adhering to spec: "Persistence: Stores research IDs and local settings"
      // If file is corrupt, safer to return default to avoid crashing, but ideally we'd warn.
      return { researchIds: [], fileSearchStores: {} };
    }
  }

  static save(config: WorkspaceConfig): void {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  static addResearchId(id: string): void {
    const config = this.load();
    if (!config.researchIds.includes(id)) {
        config.researchIds.push(id);
        this.save(config);
    }
  }

  static addFileSearchStore(name: string, resourceName: string): void {
    const config = this.load();
    config.fileSearchStores[name] = resourceName;
    this.save(config);
  }
}
