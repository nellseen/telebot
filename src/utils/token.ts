/**
 * Mask bot token for UI and display: e.g. 123456789:AA••••••••••••••••••••••••
 */
export function maskToken(token: string): string {
  if (!token) return '••••••••';
  const colonIndex = token.indexOf(':');
  if (colonIndex === -1) {
    if (token.length <= 8) return '••••••••';
    return `${token.slice(0, 4)}••••••••${token.slice(-4)}`;
  }
  const botId = token.slice(0, colonIndex);
  const secretPart = token.slice(colonIndex + 1);
  const preview = secretPart.slice(0, 3);
  return `${botId}:${preview}${'•'.repeat(Math.max(16, secretPart.length - 3))}`;
}
