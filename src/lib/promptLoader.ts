import fs from 'fs';
import path from 'path';

/**
 * Loads a prompt template from `src/prompts` and replaces double-curly placeholders.
 * E.g., `{{variableName}}` will be replaced with its value.
 *
 * @param filename - The filename of the prompt template (e.g. "validateMath.txt")
 * @param variables - The replacement values for placeholders in the prompt template
 * @returns The populated prompt string.
 */
export function getPrompt(filename: string, variables: Record<string, string | number>): string {
  const filePath = path.join(process.cwd(), 'prompts', filename);
  let content = fs.readFileSync(filePath, 'utf8');

  for (const [key, value] of Object.entries(variables)) {
    content = content.replaceAll(`{{${key}}}`, String(value));
  }

  return content;
}
