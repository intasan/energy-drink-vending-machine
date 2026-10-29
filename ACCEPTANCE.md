# Acceptance evidence — 30 October 2026

Automated executable checks are in `tests/orders.test.js`. Captured result: `evidence/api-tests.txt`.

| Case | Expected | Result |
|---|---|---|
| 2 Citrus units | Total 50, stock decreases 2 | PASS API |
| Other browser pays an order | 404, no order change | PASS API |
| Repeat payment | 409, no second stamp | PASS API |
| Cancel pending order | Restore stock once | PASS API |
| Empty/fractional/duplicate/unknown items | Reject, no stock mutation | PASS API |
| 10 paid purchases | 1 reward, stamp cycle resets | PASS API |
| Redeem reward with 2 Berry units | Total 30, consume reward once | PASS API |
| Failed replacement order | Preserve old pending reservation | PASS API |
| Chrome: add Citrus + Berry | Review total 55 | PASS browser |
| Chrome: test payment and reload | Paid, stocks 23/17, stamps 1/10 | PASS browser |

No production, bank, hardware, load or mobile-device verification claimed.
