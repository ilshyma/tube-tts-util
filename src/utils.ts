import fs from 'fs';

export async function parseScriptFile(filePath: string): Promise<{ title: string, segments: { key: string, text: string }[] }> {
  const content = await fs.promises.readFile(filePath, 'utf-8');

  const lines = content.split('\n').filter(line => line.trim() !== '');
  console.log('Processed lines:', lines); 

  if (lines.length === 0) {
    throw new Error('File is empty or contains no valid lines');
  }

  const title = lines[0].trim();
  console.log('Parsed title:', title); 


  const segments = lines.slice(1).map((line, index) => {
    const match = line.match(/^_([a-z]{2}-\d+)_:\s*(.+)$/i);
    if (!match) {
      throw new Error(`Invalid line format at line ${index + 2}: "${line}"`);
    }
    const [, key, text] = match;
    console.log(`Line ${index + 2}: Parsed key: "${key}", text: "${text.trim()}"`); 
    return { key, text: text.trim() };
  });

  console.log('Final segments:', segments); 
  return { title, segments };
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}