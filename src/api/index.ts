import express from 'express';
import { z } from 'zod';
import {
  CodeRestrictedError,
  FailedUrlRetrievalError,
  ShortCodeNotFoundError,
  Shortener,
  type ShortenerConfig,
} from '../core/shortener';

import path from 'path';
import { renderTemplate } from './templates';
import { VCS_REF, VERSION } from '../shared/version';
import { logger } from '../shared/logging';

const URLRequest = z.object({
  url: z.string().url(),
  custom_code: z.string().optional(),
});

export const startServer = async (
  hostname: string,
  port: number,
  baseUrl: string,
  shortenerConfig: ShortenerConfig,
) => {
  const app = express();

  app.use(express.json());

  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.setHeader('x-flipr-version', VERSION);
    res.setHeader('x-flipr-vcs-ref', VCS_REF);
    next();
  });

  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', baseUrl);
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
  });

  app.use(express.static(path.join(import.meta.dirname, '..', '..', 'public')));

  const shortener = new Shortener(shortenerConfig);

  app.get('/', (_req, res) => {
    res.send(
      renderTemplate('index', {
        baseUrl,
      }),
    );
  });

  app.post('/api/shorten', async (req, res) => {
    logger.info('URL shortening request', {
      type: 'shortening_try',
      originalUrl: req.body.url,
      customCode: req.body.custom_code,
    });

    try {
      const { url, custom_code } = URLRequest.parse(req.body);

      const r = shortener.shorten(url, custom_code);
      const shortUrl = `${baseUrl}/${r.code}`;

      logger.info('URL shortened successfully', {
        type: 'shortening_success',
        shortCode: r.code,
      });

      res.json({
        short_code: r.code,
        short_url: shortUrl,
        original_url: r.url,
      });
    } catch (error) {
      logger.error('API shorten error:', { type: 'shortening_error', error });

      if (error instanceof CodeRestrictedError) {
        res.status(422).json({ error: 'Custom code restricted' });
        return;
      }

      if (error instanceof FailedUrlRetrievalError) {
        res.status(500).json({ error: 'Failed to retrieve the shortened URL' });
        return;
      }

      throw error;
    }
  });

  app.get('/:shortCode', async (req, res) => {
    logger.info('Redirection request', {
      type: 'redirect_try',
      shortCode: req.params.shortCode,
    });

    try {
      const r = shortener.resolve(req.params.shortCode);

      logger.info('Redirection successful', {
        type: 'redirect_success',
        shortCode: req.params.shortCode,
        destinationUrl: r.url,
      });

      res.redirect(302, r.url);
    } catch (error) {
      logger.error('Redirect error:', { type: 'redirect_error', error });

      if (error instanceof ShortCodeNotFoundError) {
        res.status(404).send('<h1>Short URL not found</h1>');
        return;
      }

      throw error;
    }
  });

  app.get('/api/health', async (_req, res) => {
    try {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // This won't be reached in the current setup; placeholder
      res.status(500).json({
        status: 'unhealthy',
        error: (error as Error).message,
      });
    }
  });

  app.listen(port, hostname, () => {
    logger.info(`🐬 flipr.sh running on ${hostname}:${port}`);
  });
};
