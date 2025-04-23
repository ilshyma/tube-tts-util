import { parseScriptFile, delay } from './utils';
import { loadVoiceConfig } from './config';
import { logInfo, logSuccess, logError, logWarn } from './logger';
import { synthesizeText } from './api';
import path from 'path';
import fs from 'fs';
import { ElevenLabsClient } from 'elevenlabs';

async function main() {
  const [,, scriptPath] = process.argv;

  if (!scriptPath) {
    logError('Usage: node dist/index.js <scriptPath>');
    process.exit(1);
  }

  const scriptDir = path.dirname(scriptPath);
  const configPath = path.join(scriptDir, 'config.yaml');
  const outputBasePath = scriptDir;
  const apiKeyPath = path.join(scriptDir, 'apikey.txt');

  if (!fs.existsSync(configPath)) {
    logError(`Missing config.yaml at: ${configPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(apiKeyPath)) {
    logError(`Missing apikey.txt at: ${apiKeyPath}`);
    process.exit(1);
  }

  const apiKey = fs.readFileSync(apiKeyPath, 'utf-8').trim();

  logInfo(`Reading script file: ${scriptPath}`);
  const { title, segments } = await parseScriptFile(scriptPath);
  logInfo(`Script file parsed. Total segments: ${segments.length}`);

  const outputDir = path.join(outputBasePath, title);
  fs.mkdirSync(outputDir, { recursive: true });
  logInfo(`Output directory created at: ${outputDir}`);

  const configMap = loadVoiceConfig(configPath);
  logInfo(`Voice config loaded from: ${configPath}`);

  const client = new ElevenLabsClient({ apiKey });
  let completed = 0;

  for (const [index, { key, text }] of segments.entries()) {
    const lang = key.split('-')[0];
    const config = configMap[lang];
    if (!config) {
      logWarn(`No config found for language key: ${lang}`);
      continue;
    }

    logInfo(`Starting segment #${index + 1}: [${key}] "${text}"`);
    try {
      await synthesizeText(client, key, text, config, outputDir);
      completed++;
      logInfo(`Finished segment #${index + 1}: [${key}]`);
      const percent = Math.round((completed / segments.length) * 100);
      logInfo(`${percent}% complete (${completed}/${segments.length})`);
      await delay(3000);
    } catch (e) {
      logError(`Failed to synthesize segment [${key}]: ${e}`);
    }
  }

  logSuccess('All segments processed successfully. Task completed.');
}

main().catch(err => logError(`Fatal error: ${err}`));