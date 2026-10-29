# provably-fair-verifier

Small, dependency-free JavaScript module that recomputes provably fair results in the browser or Node.js 18+ with the Web Crypto API.

**Live tool:** https://cryptoplay.guide/tools/provably-fair-verifier/ (Spanish: https://cryptoplay.guide/es/herramientas/verificador-provably-fair/)

## What it checks
- **Commitment:** `SHA-256(serverSeed)` equals the hash shown before betting (Crash: `SHA-256(gameHash)` equals the previous game hash).
- **Dice / Limbo:** Stake's published formula: `HMAC-SHA256(key = serverSeed, msg = "clientSeed:nonce:0")`, first 4 bytes → float. Dice = `floor(f*10001)/100`; Limbo uses a 1% edge. A Limbo float of 0 (or any value outside (0, 1)) throws a `RangeError` instead of returning `Infinity`, matching the Python port.
- **Mines / Plinko:** Stake's published byte generator: `HMAC-SHA256(serverSeed, "clientSeed:nonce:round")`, 32 bytes per round, 4 bytes per float.
  - Mines (`mines`: 1-24): Fisher-Yates over 25 tiles (`floor(float * tilesRemaining)`), tile index 0-24 left→right, top→bottom. `result` = mine positions.
  - Plinko (`rows`: 8-16): one float per row, `floor(float * 2)` (0 = left, 1 = right). `result` = `{ path, slot }`. **Only the path and landing bucket are computed; no multipliers/payouts**, because payout tables depend on risk level and operator.
- **Crash:** bustabit's open-source formula: `HMAC-SHA256(key = salt, msg = gameHash)`, first 52 bits.

Other operators may use different formulas. If your numbers differ, check that operator's documentation. A match only confirms the commitment; it does not remove the house edge or prove payout reliability.

## Install
```sh
npm install github:cryptoplayguide/provably-fair-verifier
```
This package is not published on the npm registry yet; install it from GitHub as above. Note: the unscoped npm package `provably-fair-verifier` is not affiliated with this project.

## Usage
```js
import { fairResult } from '@cryptoplayguide/provably-fair-verifier';
const r = await fairResult({ game: 'dice', server, hash, client, nonce: '3', salt: '' });
console.log(r.matches, r.result);
const m = await fairResult({ game: 'mines', server, hash, client, nonce: '3', mines: 3 }); // m.result -> [10, 14, 7]
const p = await fairResult({ game: 'plinko', server, hash, client, nonce: '3', rows: 8 }); // p.result -> { path: [...], slot: 2 }
```
In Node pass `webcrypto` from `node:crypto` as the second argument if `globalThis.crypto` is unavailable.

## Tests
`npm test` (Node built-in test runner, no dependencies).

## License
MIT. 18+ only, educational use. Gamble responsibly.
