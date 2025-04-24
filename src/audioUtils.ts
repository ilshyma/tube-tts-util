import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { logInfo, logError } from './logger';

const SILENCE_FILE = 'silence.mp3';

export function ensureSilenceFile(baseDir: string) {
  const silencePath = path.join(baseDir, SILENCE_FILE);
  if (!fs.existsSync(silencePath)) {
    logInfo('Generating 1-second silence.mp3...');
    try {
      execSync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 1.5 -q:a 9 -acodec libmp3lame "${silencePath}"`);
      logInfo('silence.mp3 created successfully.');
    } catch (err) {
      logError('Failed to generate silence.mp3. Is ffmpeg installed?');
      process.exit(1);
    }
  }
  return silencePath;
}

export function appendSilenceToFile(filePath: string, silencePath: string) {
  const tempFile = filePath + '.tmp.mp3';
  try {
    execSync(`ffmpeg -y -i \"concat:${filePath}|${silencePath}\" -acodec copy \"${tempFile}\"`);
    fs.renameSync(tempFile, filePath);
  } catch (err) {
    logError(`Failed to append silence to ${filePath}: ${err}`);
  }
}