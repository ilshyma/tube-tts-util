import { ElevenLabsClient } from 'elevenlabs';
import { VoiceConfig } from './config';
import { delay } from './utils';
import fs from 'fs';
import path from 'path';
import { logError, logInfo } from './logger';
import { pipeline } from 'stream/promises';
import axios from 'axios';

export async function synthesizeText(
  client: ElevenLabsClient,
  key: string,
  text: string,
  config: VoiceConfig,
  outputDir: string
) {
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
          speed: config.speed ?? 1.0
        },
      });

      logInfo(`Writing audio to file: ${outputFile}`);
      await pipeline(stream, fs.createWriteStream(outputFile));
      return;
    } catch (error) {
      attempts++;
      logError(`Attempt ${attempts} failed for ${key}: ${error}`);
      await delay(1000 * attempts);
    }
  }

  throw new Error(`Failed to synthesize after 5 attempts: ${key}`);
}

export async function getCharacterLimit(apiKey: string): Promise<number> {
  // console.log("getCharacterLimit with apikey " + apiKey);
  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/user/subscription', {
      headers: {
        'xi-api-key': apiKey,
      },
    });
    const { character_limit, character_count } = response.data;
    return character_limit - character_count;
  } catch (error) {
    logError(`Failed to fetch character limit: ${error}`);
    return 0;
  }
}