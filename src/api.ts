import { ElevenLabsClient } from 'elevenlabs';
import { VoiceConfig } from './config';
import { delay } from './utils';
import fs from 'fs';
import path from 'path';
import { logError, logInfo } from './logger';
import { pipeline } from 'stream/promises';

export async function synthesizeText(
  client: ElevenLabsClient,
  key: string,
  text: string,
  config: VoiceConfig,
  outputDir: string
) {
  logInfo(`Creating directory (if not exists): ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const outputFile = path.join(outputDir, `${key}.mp3`);
  let attempts = 0;

  while (attempts < 5) {
    try {
      const stream = await client.generate({
        voice: config.voice_id,
        model_id: 'eleven_multilingual_v2',
        text,
        voice_settings: {
          stability: config.stability ?? 0.75,
          similarity_boost: config.similarity_boost ?? 0.75,
        },
      });

      logInfo(`Writing audio to file: ${outputFile}`);
      await pipeline(stream, fs.createWriteStream(outputFile));
      logInfo(`Successfully created: ${outputFile}`);
      return;
    } catch (err) {
      logError(`API call failed for ${key} (attempt ${attempts + 1}): ${err instanceof Error ? err.stack : err}`);
      attempts++;
      if (attempts < 5) await delay(10000);
    }
  }

  throw new Error(`Failed to synthesize ${key} after 5 attempts.`);
}
