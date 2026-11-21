# Test Execution Results & Verification Report

## 1. Test Environment Details

The test suite and manual browser checks were executed on the following host environment:

| Property | Value |
| :--- | :--- |
| **Operating System** | macOS 15.5 (Build 24F74) |
| **Hardware Architecture** | Apple Silicon (arm64) / Darwin Kernel 24.5.0 |
| **Node.js Version** | `v26.12.1` |
| **npm Version** | `11.7.0` |
| **Playwright Version** | `Version 1.65.1` |
| **Browser Engine** | Chromium `159.0.8154.6` (bundled via Playwright) |
| **Manual Browser** | Google Chrome `158.0.8127.36` |
| **Server Target** | `http://localhost:3000` (Native Node HTTP Static Server) |

---

## 2. Automated Playwright Suite Results

All automated tests in [`tests/checkout.spec.js`](./tests/checkout.spec.js) were executed using:
```bash
npm test
```

### 2.1 Test Execution Table

| Spec File | Test Case Name | Status | Duration |
| :--- | :--- | :---: | :---: |
| `tests/checkout.spec.js:8:3` | `Checkout Flow › Successful checkout produces a single confirmation` | **PASS** | 278ms |
| `tests/checkout.spec.js:40:3` | `Checkout Flow › Missing required field blocks checkout and preserves state` | **PASS** | 224ms |
| `tests/checkout.spec.js:83:3` | `Checkout Flow › Quantity change updates line totals and exact order total` | **PASS** | 258ms |

**Summary**: **3 passed (1.4s)** | **Exit Code**: `0` | **Flaky Retries**: `0`

### 2.2 Raw Terminal Output

```text
> checkout-challenge@1.0.0 test
> playwright test


Running 3 tests using 1 worker

[1/3] …:8:3 › Checkout Flow › Successful checkout produces a single confirmation
[2/3] …heckout Flow › Missing required field blocks checkout and preserves state
[3/3] …Checkout Flow › Quantity change updates line totals and exact order total
  3 passed (1.4s)

To open last HTML report run:

  npx playwright show-report
```

---

## 3. Manual & Exploratory Browser Check Results

Manual testing was conducted in Google Chrome 158.0.8127.36 against the live application served on `http://localhost:3000`:

### Check 1: Empty Cart Checkout Block
* **Steps Executed**:
  1. Opened `http://localhost:3000` in Google Chrome with 0 items in cart.
  2. Entered `"Alex Rivera"` into the "Full Name" input.
  3. Clicked "Place Order".
* **Observed Result**: Blocked with alert, input preserved, 0 confirmations, 0 console errors.
* **Evidence Screenshot**: [`./evidence/01-empty-cart-blocked.png`](./evidence/01-empty-cart-blocked.png)

---

### Check 2: Rapid Double-Click Concurrency
* **Steps Executed**:
  1. Opened `http://localhost:3000` in Google Chrome.
  2. Added 1 Ceramic Coffee Mug ($14.50) to the cart.
  3. Entered `"Alex Rivera"` into the "Full Name" input.
  4. Rapidly double-clicked "Place Order".
* **Observed Result**: Button disabled immediately, exactly 1 confirmation shown with order reference `ORD-HK8NFS7U`, 0 console errors.
* **Evidence Screenshot**: [`./evidence/02-rapid-double-click.png`](./evidence/02-rapid-double-click.png)

---

## 4. Defect Log

No defects were found during automated or manual testing.
