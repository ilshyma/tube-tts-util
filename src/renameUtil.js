import { readdir, rename } from 'fs/promises';
import { join } from 'path';

async function renameFiles(dir) {
  // Регулярка: две буквы, дефис, цифры, .mp3
  const pattern = /^([a-z]{2})-(\d+)\.mp3$/;

  const files = await readdir(dir);
  for (const file of files) {
    const match = file.match(pattern);
    if (!match) continue;

    const [ , lang, idx ] = match;
    const oldPath = join(dir, file);
    const newName = `${idx}-${lang}.mp3`;
    const newPath = join(dir, newName);

    console.log(`Переименовываем: ${file} → ${newName}`);
    await rename(oldPath, newPath);
  }
}

const folder = './';  
renameFiles(folder)
  .then(() => console.log('Готово!'))
  .catch(err => console.error('Ошибка:', err));