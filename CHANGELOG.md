# Changelog

## 1.0.1 - 2026-10-28
- Fix: Limbo with float input 0 returned `Infinity`; now throws `RangeError` (also for NaN/out-of-range), consistent with the Python port. Added `limboMultiplier` export and tests.

## 1.0.0
- Initial release.
