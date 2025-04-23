import fs from 'fs';
import yaml from 'yaml';
import path from 'path';

export type VoiceConfig = {
  voice_id: string;
  stability?: number;
  similarity_boost?: number;
};

export type ConfigMap = Record<string, VoiceConfig>;

export function loadVoiceConfig(filePath: string): ConfigMap {
  try {
    const fullPath = path.resolve(filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    return yaml.parse(content);
  } catch (error) {
    throw new Error(`Error loading config from ${filePath}: ${error}`);
  }
}