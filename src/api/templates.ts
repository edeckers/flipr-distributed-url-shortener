import fs from 'fs';
import path from 'path';
import { logger } from '../shared/logging';

export function renderTemplate(
  templateName: string,
  variables: Record<string, string> = {},
): string {
  try {
    const templatePath = path.join(
      import.meta.dirname,
      '..',
      '..',
      'views',
      `${templateName}.html`,
    );
    let html = fs.readFileSync(templatePath, 'utf-8');

    // Replace all {{variable}} placeholders with actual values
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      html = html.replace(new RegExp(placeholder, 'g'), value);
    }

    return html;
  } catch (error) {
    logger.error(`Template rendering error for ${templateName}: ${error}`);
    return `<h1>Template Error</h1><p>Could not load template: ${templateName}</p>`;
  }
}
