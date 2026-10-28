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
