import { Command } from 'commander';
import { startServer } from './api/index';
import { loadConfig, showConfig } from './api/config';
import { VERSION } from './shared/version';

const program = new Command();

program.name('flipr').description('flipr.sh - URL shortener').version(VERSION);

program
  .command('serve')
  .description('Start the Express API server')
  .option('-p, --port <port>', 'Port to run on', undefined)
  .option('-h, --host <host>', 'Host to bind to', undefined)
  .option('-u, --url <url>', 'Base url', undefined)
  .option('-s, --sc-length <sc-length>', 'Shortcode length', undefined)
  .action(async (options) => {
    const config = loadConfig();

    await startServer(
      options.host || config.hostname,
      options.port || config.port,
      options.url || config.baseUrl,
      {
        codeBlockList: config.codeBlockList,
        shortcodeLength: config.shortcodeLength,
      },
    );
  });

program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    showConfig();
  });

program.parse();
