# Changelog

## 1.1.0 - 2026-10-29
- Add Mines (1-24 mines) and Plinko (8-16 rows) verification using Stake's published multi-round byte generator; same output as the live verifier on cryptoplay.guide. Plinko returns path and bucket (slot) only, no multipliers.
- New exports: `stakeFloats`, `minesFromFloats`, `plinkoFromFloats`.

## 1.0.1 - 2026-10-28
- Package renamed to `@cryptoplayguide/provably-fair-verifier` (not yet published to npm; install via `npm install github:cryptoplayguide/provably-fair-verifier`). The unscoped `provably-fair-verifier` on npm belongs to an unrelated author.
- Fix: Limbo with float input 0 returned `Infinity`; now throws `RangeError` (also for NaN/out-of-range), consistent with the Python port. Added `limboMultiplier` export and tests.

## 1.0.0
- Initial release.
