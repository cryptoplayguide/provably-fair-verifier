// Documented Stake Dice/Limbo/Mines/Plinko and bustabit Crash formulas, without input repair.
const encoder = new TextEncoder();
export const hex = bytes => Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2, '0')).join('');
export function unhex(value) {
  if (!/^[0-9a-f]{64}$/i.test(value)) throw new Error('invalid_hash');
  return Uint8Array.from(value.match(/../g), pair => parseInt(pair, 16));
}
export function validateFair({ game, server, hash, nonce, mines, rows }) {
  if (!['dice', 'limbo', 'crash', 'mines', 'plinko'].includes(game)) throw new Error('invalid_input');
  if (!/^[0-9a-f]{64}$/i.test(hash) || (game === 'crash' && !/^[0-9a-f]{64}$/i.test(server))) throw new Error('invalid_hash');
  if (!server) throw new Error('invalid_input');
  if (game === 'mines' && !(/^\d+$/.test(String(mines)) && +mines >= 1 && +mines <= 24)) throw new Error('invalid_extra');
  if (game === 'plinko' && !(/^\d+$/.test(String(rows)) && +rows >= 8 && +rows <= 16)) throw new Error('invalid_extra');
  if (game !== 'crash' && (!/^\d+$/.test(nonce) || !Number.isSafeInteger(Number(nonce)))) throw new Error('invalid_nonce');
}
export const LIMBO_ZERO_MESSAGE = 'Limbo float must be greater than 0 and finite (got 0): multiplier would be Infinity';
export function limboMultiplier(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value >= 1) throw new RangeError(value === 0 ? LIMBO_ZERO_MESSAGE : `Limbo float must be in (0, 1), got ${value}`);
  return Math.max(Math.floor(1e8 / (value * 1e8) * .99 * 100) / 100, 1);
}
// Stake implementation page: bytes from HMAC_SHA256(serverSeed, `${clientSeed}:${nonce}:${round}`), 32 bytes per round,
// 4 bytes per float (float = sum byte/256^(i+1)). Game events page: Mines = Fisher-Yates over 25 tiles (float x tiles remaining),
// grid position left->right, top->bottom; Plinko = floor(float x 2), 0 = left, 1 = right, one float per row (8-16 rows).
export async function stakeFloats(server, client, nonce, count, webCrypto = globalThis.crypto) {
  const key = await webCrypto.subtle.importKey('raw', encoder.encode(server), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const floats = [];
  for (let round = 0; floats.length < count; round++) {
    const b = new Uint8Array(await webCrypto.subtle.sign('HMAC', key, encoder.encode(`${client}:${Number(nonce)}:${round}`)));
    for (let i = 0; i < 32 && floats.length < count; i += 4) floats.push(b[i] / 256 + b[i + 1] / 256 ** 2 + b[i + 2] / 256 ** 3 + b[i + 3] / 256 ** 4);
  }
  return floats;
}
export function minesFromFloats(floats, mines) {
  const tiles = Array.from({ length: 25 }, (_, i) => i), out = [];
  for (let i = 0; i < mines; i++) out.push(tiles.splice(Math.floor(floats[i] * (25 - i)), 1)[0]);
  return out;
}
export function plinkoFromFloats(floats, rows) {
  const path = floats.slice(0, rows).map(f => Math.floor(f * 2));
  return { path, slot: path.reduce((a, b) => a + b, 0) };
}
export async function fairResult(input, webCrypto = globalThis.crypto) {
  if (input.game === 'mines' || input.game === 'plinko') {
    validateFair(input);
    const { game, server, hash, client, nonce } = input;
    const commitment = hex(await webCrypto.subtle.digest('SHA-256', encoder.encode(server)));
    const n = game === 'mines' ? 24 : Number(input.rows);
    const floats = await stakeFloats(server, client, nonce, n, webCrypto);
    const result = game === 'mines' ? minesFromFloats(floats, Number(input.mines)) : plinkoFromFloats(floats, Number(input.rows));
    return { commitment, matches: commitment === hash.toLowerCase(), floats, result };
  }
  validateFair(input);
  const { game, server, hash, client, nonce, salt } = input;
  const commitment = hex(await webCrypto.subtle.digest('SHA-256', game === 'crash' ? unhex(server) : encoder.encode(server)));
  const key = await webCrypto.subtle.importKey('raw', encoder.encode(game === 'crash' ? salt : server), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await webCrypto.subtle.sign('HMAC', key, game === 'crash' ? unhex(server) : encoder.encode(`${client}:${Number(nonce)}:0`)));
  const digest = hex(bytes);
  const value = game === 'crash' ? parseInt(digest.slice(0, 13), 16) / 2 ** 52 : bytes.slice(0, 4).reduce((sum, byte, i) => sum + byte / 256 ** (i + 1), 0);
  const result = game === 'crash' ? Math.max(1, Math.floor(99 / (1 - value)) / 100) : game === 'dice' ? Math.floor(value * 10001) / 100 : limboMultiplier(value);
  return { commitment, matches: commitment === hash.toLowerCase(), bytes, digest, value, result };
}
