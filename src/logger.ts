import chalk from 'chalk';

export const logInfo = (msg: string) => console.log(chalk.blue('[INFO]'), msg);
export const logSuccess = (msg: string) => console.log(chalk.green('[SUCCESS]'), msg);
export const logError = (msg: string) => console.error(chalk.red('[ERROR]'), msg);
export const logWarn = (msg: string) => console.warn(chalk.yellow('[WARN]'), msg);


