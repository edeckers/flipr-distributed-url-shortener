import dotenv from 'dotenv';
import { logger } from '../shared/logging';

dotenv.config();
dotenv.config({ path: `.env.local`, override: true });

const DEFAULT_HOSTNAME = '127.0.0.1';
const DEFAULT_PORT = 8_000;
const DEFAULT_SHORTCODE_LENGTH = 6;

const assertConfig = () => {
  if (!process.env.PORT) {
    logger.warn(
      `No PORT environment variable set, defaulting to ${DEFAULT_PORT}`,
    );
  }

  if (!process.env.SHORTCODE_LENGTH) {
    logger.warn(
      `No SHORTCODE_LENGTH environment variable set, defaulting to ${DEFAULT_SHORTCODE_LENGTH}`,
    );
  }

  if (!process.env.BASE_URL) {
    logger.error('Error: BASE_URL environment variable not set');
    process.exit(1);
  }
};

export const loadConfig = () => {
  logger.info('Loading configuration from environment variables');
  assertConfig();

  return {
    baseUrl: process.env.BASE_URL!,
    hostname: process.env.HOSTNAME || DEFAULT_HOSTNAME,
    port: process.env.PORT || DEFAULT_PORT,
    codeBlockList: {
      reserved: new Set(
        (process.env.CODE_BLOCK_LIST_RESERVED || '')
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 0),
      ),
      offensive: new Set(
        (process.env.CODE_BLOCK_LIST_OFFENSIVE || '')
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 0),
      ),
      protected: new Set(
        (process.env.CODE_BLOCK_LIST_PROTECTED || '')
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 0),
      ),
    },
    shortcodeLength:
      parseInt(process.env.SHORTCODE_LENGTH || '', 10) ||
      DEFAULT_SHORTCODE_LENGTH,
  };
};

export const showConfig = () => {
  const config = loadConfig();

  logger.info('Current Configuration:');
  logger.info(`BASE_URL ${config.baseUrl}`);
  logger.info(`HOSTNAME: ${config.hostname}`);
  logger.info(`PORT: ${config.port}`);
  logger.info(`SHORTCODE_LENGTH: ${config.shortcodeLength}`);
};
