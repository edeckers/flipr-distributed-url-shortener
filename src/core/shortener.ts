import { validator } from './validator';

const NUMBER_OF_CODE_GENERATOR_RETRIES = 10;

type ShortRecord = {
  code: string;
  url: string;
};
export class CodeRestrictedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodeRestrictedError';
  }
}

export class FailedUrlRetrievalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FailedUrlRetrievalError';
  }
}

export class ShortCodeNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShortCodeNotFoundError';
  }
}

const lookup: { [key: string]: ShortRecord } = {};

const generateShortCode = (length: number) => {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const exists = (code: string) => !!lookup[code];

const insert = (code: string, url: string) => {
  lookup[code] = { code, url };
};

const get = (code: string): ShortRecord => lookup[code];

const generateShortCodeWithRetry = (
  length: number,
  validate: (code: string) => boolean,
) => {
  let code = generateShortCode(length);
  let attempts = 0;
  while (attempts < NUMBER_OF_CODE_GENERATOR_RETRIES) {
    if (validate(code)) {
      return code;
    }

    code = generateShortCode(length);
    attempts++;
  }

  throw new Error('Failed to generate a unique short code');
};

type CodeBlockList = {
  reserved: Set<string>;
  offensive: Set<string>;
  protected: Set<string>;
};

export type ShortenerConfig = {
  shortcodeLength: number;
  codeBlockList: CodeBlockList;
};
export class Shortener {
  private readonly validate: (code: string) => boolean;

  public constructor(private readonly config: ShortenerConfig) {
    this.validate = validator(
      this.config.codeBlockList.reserved,
      this.config.codeBlockList.offensive,
      this.config.codeBlockList.protected,
    );
  }
  private test = (code: string) => this.validate(code) && !exists(code);

  public shorten = (url: string, customCode?: string): ShortRecord => {
    if (customCode && !this.test(customCode)) {
      throw new CodeRestrictedError('Custom code is restricted');
    }

    let newShortCode =
      customCode ||
      generateShortCodeWithRetry(this.config.shortcodeLength, this.test);

    insert(newShortCode, url);

    const r = get(newShortCode);
    if (!r) {
      throw new FailedUrlRetrievalError('Failed to retrieve the shortened URL');
    }

    return {
      code: r.code,
      url: r.url,
    };
  };

  public resolve = (shortCode: string): ShortRecord => {
    if (!exists(shortCode)) {
      throw new ShortCodeNotFoundError('Short code not found');
    }

    return get(shortCode);
  };
}
