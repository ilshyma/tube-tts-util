import fs from 'fs';
import path from 'path';

let logFilePath = 'log.txt';

export function initLogger(outputDir: string) {
  logFilePath = path.join(outputDir, 'log.txt');
}

function writeLogToFile(message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
}

export function logInfo(message: string) {
  console.log(`ℹ️ ${message}`);
  writeLogToFile(`INFO: ${message}`);
}

export function logSuccess(message: string) {
  console.log(`✅ ${message}`);
  writeLogToFile(`SUCCESS: ${message}`);
}

export function logError(message: string) {
  console.error(`❌ ${message}`);
  writeLogToFile(`ERROR: ${message}`);
}

export function logWarn(message: string) {
  console.warn(`⚠️ ${message}`);
  writeLogToFile(`WARN: ${message}`);
}