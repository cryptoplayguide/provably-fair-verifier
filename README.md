# provably-fair-verifier

Small, dependency-free JavaScript module that recomputes provably fair results in the browser or Node.js 18+ with the Web Crypto API.

**Live tool:** https://cryptoplay.guide/tools/provably-fair-verifier/ (Spanish: https://cryptoplay.guide/es/herramientas/verificador-provably-fair/)

## What it checks
- **Commitment:** `SHA-256(serverSeed)` equals the hash shown before betting (Crash: `SHA-256(gameHash)` equals the previous game hash).
- **Dice / Limbo:** Stake's published formula: `HMAC-SHA256(key = serverSeed, msg = "clientSeed:nonce:0")`, first 4 bytes → float. Dice = `floor(f*10001)/100`; Limbo uses a 1% edge. A Limbo float of 0 (or any value outside (0, 1)) throws a `RangeError` instead of returning `Infinity`, matching the Python port.
- **Crash:** bustabit's open-source formula: `HMAC-SHA256(key = salt, msg = gameHash)`, first 52 bits.

Other operators may use different formulas. If your numbers differ, check that operator's documentation. A match only confirms the commitment; it does not remove the house edge or prove payout reliability.

## Usage
```js
import { fairResult } from './src/index.js';
const r = await fairResult({ game: 'dice', server, hash, client, nonce: '3', salt: '' });
console.log(r.matches, r.result);
```
In Node pass `webcrypto` from `node:crypto` as the second argument if `globalThis.crypto` is unavailable.

## Tests
`npm test` (Node built-in test runner, no dependencies).

## License
MIT. 18+ only, educational use. Gamble responsibly.
