// Documented Stake Dice/Limbo and bustabit Crash formulas, without input repair.
const encoder = new TextEncoder();
export const hex = bytes => Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2, '0')).join('');
export function unhex(value) {
  if (!/^[0-9a-f]{64}$/i.test(value)) throw new Error('invalid_hash');
  return Uint8Array.from(value.match(/../g), pair => parseInt(pair, 16));
}
export function validateFair({ game, server, hash, nonce }) {
  if (!['dice', 'limbo', 'crash'].includes(game)) throw new Error('invalid_input');
  if (!/^[0-9a-f]{64}$/i.test(hash) || (game === 'crash' && !/^[0-9a-f]{64}$/i.test(server))) throw new Error('invalid_hash');
  if (!server) throw new Error('invalid_input');
  if (game !== 'crash' && (!/^\d+$/.test(nonce) || !Number.isSafeInteger(Number(nonce)))) throw new Error('invalid_nonce');
}
export async function fairResult(input, webCrypto = globalThis.crypto) {
  validateFair(input);
  const { game, server, hash, client, nonce, salt } = input;
  const commitment = hex(await webCrypto.subtle.digest('SHA-256', game === 'crash' ? unhex(server) : encoder.encode(server)));
  const key = await webCrypto.subtle.importKey('raw', encoder.encode(game === 'crash' ? salt : server), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await webCrypto.subtle.sign('HMAC', key, game === 'crash' ? unhex(server) : encoder.encode(`${client}:${Number(nonce)}:0`)));
  const digest = hex(bytes);
  const value = game === 'crash' ? parseInt(digest.slice(0, 13), 16) / 2 ** 52 : bytes.slice(0, 4).reduce((sum, byte, i) => sum + byte / 256 ** (i + 1), 0);
  const result = game === 'crash' ? Math.max(1, Math.floor(99 / (1 - value)) / 100) : game === 'dice' ? Math.floor(value * 10001) / 100 : Math.max(Math.floor(1e8 / (value * 1e8) * .99 * 100) / 100, 1);
  return { commitment, matches: commitment === hash.toLowerCase(), bytes, digest, value, result };
}
