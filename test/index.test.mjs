import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { fairResult, validateFair, limboMultiplier, LIMBO_ZERO_MESSAGE } from '../src/index.js';
const input = { game:'dice', server:'e3f1b5c2a9d84f6e7b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6', hash:'1c7bc4411405303e0f84ab57dea9691c6376ee6891b289a65edac408519e6009', client:'example-client-seed', nonce:'3', salt:'example-public-salt' };
const crashHash='5b1b2c0d6d5f1c3a9e7b8a4f2c6d0e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d', crashPrev='697784550a6834d20d7567a30cd02e71d8e922bdeba59850b541ffc2caab52e9';
test('example vectors', async () => {
  const d = await fairResult(input, webcrypto); assert.equal(d.result, 42.62); assert.equal(d.matches, true);
  assert.equal((await fairResult({...input, game:'limbo'}, webcrypto)).result, 2.32);
  const c = await fairResult({...input, game:'crash', server:crashHash, hash:crashPrev}, webcrypto);
  assert.equal(c.result, 1.44); assert.equal(c.matches, true);
  assert.equal((await fairResult({...input, hash:'0'.repeat(64)}, webcrypto)).matches, false);
});
test('rejects malformed input', () => {
  for (const server of ['abc','','zz'.repeat(32)]) assert.throws(() => validateFair({...input, game:'crash', server}));
  assert.throws(() => validateFair({...input, nonce:'-1'}));
  assert.throws(() => validateFair({...input, game:'roulette'}));
});
test('limbo rejects zero and invalid floats', () => {
  assert.throws(() => limboMultiplier(0), { name: 'RangeError', message: LIMBO_ZERO_MESSAGE });
  for (const v of [-0.1, 1, NaN, Infinity, '0.5']) assert.throws(() => limboMultiplier(v), RangeError);
  assert.equal(limboMultiplier(0.5), 1.98);
});
// Mines/Plinko vectors: identical to the live cryptoplay.guide verifier output and to Stake's published byteGenerator.
import { createHmac } from 'node:crypto';
import { minesFromFloats, plinkoFromFloats, stakeFloats } from '../src/index.js';
function refFloats(s, c, n, count) { const out = [];
  for (let r = 0; out.length < count; r++) { const b = createHmac('sha256', s).update(`${c}:${n}:${r}`).digest();
    for (let i = 0; i < 32 && out.length < count; i += 4) out.push(b[i] / 256 + b[i+1] / 256 ** 2 + b[i+2] / 256 ** 3 + b[i+3] / 256 ** 4); } return out; }
test('mines known vectors', async () => {
  const m3 = await fairResult({ ...input, game: 'mines', mines: 3 }, webcrypto);
  assert.equal(m3.matches, true); assert.deepEqual(m3.result, [10, 14, 7]);
  const m24 = await fairResult({ ...input, game: 'mines', mines: 24 }, webcrypto);
  assert.deepEqual(m24.result, [10,14,7,0,18,1,5,9,12,3,19,6,24,17,20,15,16,21,13,11,22,8,4,23]);
  assert.deepEqual(m24.floats, refFloats(input.server, input.client, 3, 24));
});
test('plinko known vectors (path/slot only)', async () => {
  assert.deepEqual((await fairResult({ ...input, game: 'plinko', rows: 8 }, webcrypto)).result, { path: [0,1,0,0,1,0,0,0], slot: 2 });
  assert.deepEqual((await fairResult({ ...input, game: 'plinko', rows: 16 }, webcrypto)).result, { path: [0,1,0,0,1,0,0,0,0,0,1,0,1,1,1,1], slot: 7 });
});
test('mines/plinko helpers and validation', async () => {
  assert.deepEqual(minesFromFloats([0, 0.999], 2), [0, 24]);
  assert.deepEqual(plinkoFromFloats([0.1, 0.6, 0.7], 3), { path: [0, 1, 1], slot: 2 });
  assert.equal((await stakeFloats(input.server, input.client, 3, 1, webcrypto))[0], (await fairResult(input, webcrypto)).value);
  for (const mines of [0, 25, 'x']) assert.throws(() => validateFair({ ...input, game: 'mines', mines }), /invalid_extra/);
  for (const rows of [7, 17]) assert.throws(() => validateFair({ ...input, game: 'plinko', rows }), /invalid_extra/);
});
