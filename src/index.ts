import { parseScriptFile, delay } from './utils';
import { loadVoiceConfig } from './config';
import { initLogger, logInfo, logSuccess, logError, logWarn } from './logger';
import { synthesizeText, getCharacterLimit } from './api';
import path from 'path';
import fs from 'fs';
import { ElevenLabsClient } from 'elevenlabs';

const PROCESSED_FILE = 'processed.txt';

function loadProcessedKeys(filePath: string): Set<string> {
  if (!fs.existsSync(filePath)) return new Set();
  return new Set(fs.readFileSync(filePath, 'utf-8').split('\n').map(line => line.trim()).filter(Boolean));
}

function saveProcessedKey(filePath: string, key: string) {
  fs.appendFileSync(filePath, key + '\n');
}

async function main() {
  const [,, scriptPath] = process.argv;

  if (!scriptPath) {
    logError('Usage: node dist/index.js <scriptPath>');
    process.exit(1);
  }

  const scriptDir = path.dirname(scriptPath);
  initLogger(scriptDir);
  const configPath = path.join(scriptDir, 'config.yaml');
  const outputBasePath = path.join(scriptDir, 'audio');
  const apiKeyPath = path.join(scriptDir, 'apikey.txt');
  const processedPath = path.join(scriptDir, PROCESSED_FILE);

  if (!fs.existsSync(configPath)) {
    logError(`Missing config.yaml at: ${configPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(apiKeyPath)) {
    logError(`Missing apikey.txt at: ${apiKeyPath}`);
    process.exit(1);
  }

  const apiKey = fs.readFileSync(apiKeyPath, 'utf-8').trim();
  const client = new ElevenLabsClient({ apiKey });
  const configMap = await loadVoiceConfig(configPath);
  const supportedLangs = Object.keys(configMap);
  const isSingleLang = supportedLangs.length === 1;
  const onlyLang = supportedLangs[0];

  logInfo(`Reading script file: ${scriptPath}`);
  const { segments } = await parseScriptFile(scriptPath);

  const processedKeys = loadProcessedKeys(processedPath);

  if (!fs.existsSync(outputBasePath)) {
    fs.mkdirSync(outputBasePath);
  }

  for (const { key, text } of segments) {
    const idKey = `_${key}_`;
    const outputFile = path.join(outputBasePath, `${key}.mp3`);
    const lang = key.split('-')[0];

    if (isSingleLang && lang !== onlyLang) {
      logWarn(`Skipping ${key}: only '${onlyLang}' is configured in config.yaml`);
      continue;
    }

    if (processedKeys.has(idKey)) {
      logInfo(`Skipping already processed: ${idKey}`);
      continue;
    }

    const voiceConfig = configMap[lang];
    if (!voiceConfig) {
      logWarn(`Skipping ${key}: no voice config found for language: ${lang}`);
      continue;
    }

    const available = await getCharacterLimit(apiKey);
    if (text.length > available) {
      logError(`Text length (${text.length}) exceeds available characters (${available}). Replace API key.`);
      process.exit(1);
    }

    try {
      logInfo(`Synthesizing: ${idKey}`);
      await synthesizeText(client, key, text, voiceConfig, outputBasePath);
      logSuccess(`Saved to ${outputFile}`);
      saveProcessedKey(processedPath, idKey);
    } catch (e) {
      logError(`Failed to synthesize ${idKey}: ${e}`);
    }

    await delay(1000);
  }
}

main().catch(err => logError(err));