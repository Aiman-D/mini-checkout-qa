# Test Plan: E-Commerce Cart & Checkout Verification

## 1. Executive Summary & Strategy
This document defines the quality assurance strategy, scope, risk analysis, automated test suite architecture, and exploratory manual testing procedures for the Vanilla JavaScript E-Commerce Cart and Single-Page Checkout Application.

The primary objective is to verify functional correctness, exact integer currency arithmetic without floating-point errors, strict validation integrity, accessible markup, and foolproof idempotency safeguards against duplicate submissions under concurrent or rapid user interactions.

---

## 2. Scope of Testing

### 2.1 In-Scope
* **Core Product & Cart Operations**:
  * Adding catalog items: Ceramic Coffee Mug ($14.50 / 1450¢) and Canvas Tote Bag ($22.75 / 2275¢).
  * Line-item quantity increments, decrements, direct numeric input modifications, and item removals.
  * Integer-cents math validation preventing fractional cents or floating-point drift.
* **Form Validation & State Retention**:
  * Mandatory "Full Name" input validation (preventing empty and whitespace-only submissions).
  * Cart state validation (blocking checkout on 0 items).
  * Form and cart preservation upon validation errors (retaining entered text and line items).
* **Order Processing & Idempotency**:
  * Synchronous submission locking on line 1 of the submit handler.
  * Atomic transition to confirmation state.
  * Prevention of duplicate orders under rapid double-click, triple-click, rapid double-Enter keypress, or programmatic re-submission.
  * Order reference generation matching `/^ORD-[A-Z0-9]{6,8}$/`.
* **Accessibility & UX**:
  * Semantic HTML elements (`<form novalidate>`, `<label for="...">`, `<input>`).
  * ARIA attributes (`role="alert"` for errors, `role="status"` for confirmation).
  * High-contrast styling and complete offline execution capability.

### 2.2 Out-of-Scope
* External payment gateway integrations (Stripe, PayPal, etc.).
* Multi-page routing and persistent server-side relational databases.
* User account registration, login authentication, and password reset flows.
* Third-party inventory management synchronization.

---

## 3. Test Environment Specifications

| Component | Target Specification |
| :--- | :--- |
| **Operating System** | macOS (Darwin ARM64 / Apple Silicon) |
| **Runtime Environment** | Node.js (Active LTS / Current) |
| **Static Web Server** | Zero-dependency native Node `http` server (`server.js`) on port 3000 |
| **Testing Framework** | Playwright Test (`@playwright/test`) |
| **Browser Engine** | Chromium (bundled headless and headed via Playwright) |
| **Test Execution Mode** | Isolated browser contexts with zero external network dependencies |

---

## 4. Risk-Prioritized Test Matrix

| ID | Priority | Risk Category | Description & Scenario | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **TC-P0-01** | **P0 (Critical)** | Financial Integrity / Float Drift | Calculation of item totals and cumulative order total across mixed quantities (e.g. 3 Mugs @ $14.50 = $43.50; 2 Totes @ $22.75 = $45.50; Total = $89.00). | Exact dollar and cent calculations stored in integer cents; zero decimal roundoff drift (e.g. `$89.00`, never `$88.99999999999999`). |
| **TC-P0-02** | **P0 (Critical)** | Idempotency / Double Submission | Rapid double-click on "Place Order" or rapid double-Enter in "Full Name" field on a valid order. | Immediate synchronous lock engages; button disables; exactly one confirmation panel renders; order ID never mutates. |
| **TC-P1-01** | **P1 (High)** | Validation / Empty Cart Block | User enters a valid customer name but the cart contains 0 items, then submits the order. | Submission is blocked; accessible alert (`role="alert"`) displays: *"Your cart is empty. Add at least one item before placing an order."*; name is preserved; 0 confirmations created. |
| **TC-P1-02** | **P1 (High)** | Validation / Missing Name | User has items in cart but leaves Full Name empty or enters whitespace only (`"   "`), then submits. | Submission is blocked; accessible alert (`role="alert"`) displays: *"Please enter your full name before placing an order."*; cart contents and line totals preserved. |
| **TC-P1-03** | **P1 (High)** | State Preservation | User enters name and modifies cart, then triggers an error condition (empty name or clearing cart). | No input wiped; customer name text remains intact in input field; line items and quantities remain untouched. |
| **TC-P2-01** | **P2 (Medium)** | Edge Cases / Quantity Clamping | User inputs negative quantity (`-5`), non-numeric text (`abc`), or clears quantity field. | Handled gracefully: clamped to valid minimum or removed cleanly if set to 0; no `NaN` or negative monetary amounts shown. |
| **TC-P2-02** | **P2 (Medium)** | Accessibility & Semantics | Screen reader attributes and semantic labeling across forms and dynamic alerts. | Form has `<label for="customer-name">`; validation messages use `role="alert"`; confirmation uses `role="status"` and `data-testid="order-confirmation"`. |

---

## 5. Automated Test Mapping (Playwright Test Suite)

All automated tests are housed in [`tests/checkout.spec.js`](./tests/checkout.spec.js). Each test executes in an isolated browser context, utilizes user-facing locators (`getByRole`, `getByLabel`), and enforces web-first assertions with zero arbitrary `waitForTimeout` or sleep calls.

### Test 1: Successful checkout produces a single confirmation
* **Target Objective**: Validate end-to-end purchasing workflow, exact line/order total calculation, and confirmation rendering.
* **Test Steps**:
  1. Navigate to `/`.
  2. Click "Add to Cart" for Ceramic Coffee Mug ($14.50).
  3. Click "Add to Cart" for Canvas Tote Bag ($22.75).
  4. Locate "Full Name" input via `getByLabel('Full Name')` and fill with `"Alex Rivera"`.
  5. Click "Place Order" via `getByRole('button', { name: /Place Order/i })`.
  6. Assert exactly one confirmation element with `role="status"` and `data-testid="order-confirmation"` is visible.
  7. Assert order reference text matches regex `/^ORD-[A-Z0-9]{6,8}$/`.
  8. Assert customer name `"Alex Rivera"` and formatted order total `$37.25` are visible inside the confirmation.

### Test 2: Missing required field blocks checkout and preserves state
* **Target Objective**: Verify validation blocks submission for empty and whitespace-only name inputs while preserving cart state.
* **Test Steps**:
  1. Navigate to `/`.
  2. Click "Add to Cart" for Ceramic Coffee Mug.
  3. Leave "Full Name" empty; click "Place Order".
  4. Assert `role="alert"` validation message is visible.
  5. Assert order confirmation count is 0 (`toHaveCount(0)`).
  6. Assert Ceramic Coffee Mug is still in cart with quantity 1 and total `$14.50`.
  7. Fill "Full Name" with whitespace `"   "`; click "Place Order".
  8. Assert `role="alert"` validation message is visible.
  9. Assert order confirmation count remains 0.
  10. Assert cart items and totals remain completely intact.

### Test 3: Quantity change updates line totals and exact order total
* **Target Objective**: Verify dynamic calculation accuracy, integer cent math, increment/decrement controls, and total recomputation.
* **Test Steps**:
  1. Navigate to `/`.
  2. Add Ceramic Coffee Mug ($14.50) to cart; set quantity to 3 via `getByLabel('Quantity of Ceramic Coffee Mug', { exact: true })`.
  3. Add Canvas Tote Bag ($22.75) to cart; set quantity to 2 via `getByLabel('Quantity of Canvas Tote Bag', { exact: true })`.
  4. Verify Mug line total equals `$43.50` (3 × 1450¢ = 4350¢).
  5. Verify Tote line total equals `$45.50` (2 × 2275¢ = 4550¢).
  6. Verify grand order total equals `$89.00` (4350¢ + 4550¢ = 8900¢).
  7. Decrement Mug quantity using `getByRole('button', { name: 'Decrease quantity of Ceramic Coffee Mug' })`; assert line total updates to `$29.00` and order total to `$74.50`.
  8. Remove Canvas Tote Bag using `getByRole('button', { name: 'Remove Canvas Tote Bag' })`; assert order total updates to `$29.00`.

---

## 6. Manual & Exploratory Test Procedures

### Procedure A: Empty Cart Checkout Attempt
* **Objective**: Ensure that a user attempting to checkout with no items in the cart is prevented from placing an order, receives clear accessible feedback, and does not experience form clearing or console errors.
* **Pre-conditions**: Clean browser session loaded at `http://localhost:3000`. Cart shows 0 items.
* **Step-by-Step Instructions**:
  1. Open DevTools Console (assert 0 console errors present).
  2. In the "Full Name" field, type `"Alex Rivera"`.
  3. Verify that the shopping cart is completely empty (no line items, total $0.00).
  4. Click the "Place Order" button.
* **Expected Result**:
  - The order is NOT submitted.
  - A validation message with `role="alert"` appears stating that the cart is empty (e.g. *"Your cart is empty. Add at least one item before placing an order."*).
  - The Full Name field retains `"Alex Rivera"` without truncation or reset.
  - No order confirmation panel is created or shown.
  - Zero unhandled console warnings or JavaScript exceptions.
* **Evidence**: Screenshot captured at [`./evidence/01-empty-cart-blocked.png`](./evidence/01-empty-cart-blocked.png).

---

### Procedure B: Rapid Double-Click & Double-Enter Concurrency
* **Objective**: Confirm that the application's synchronous submission lock prevents duplicate orders, race conditions, or multiple confirmation components when rapid successive submission triggers occur.
* **Pre-conditions**: Clean browser session loaded at `http://localhost:3000`.
* **Step-by-Step Instructions**:
  1. Open DevTools Console.
  2. Click "Add to Cart" on Ceramic Coffee Mug.
  3. In the "Full Name" field, type `"Alex Rivera"`.
  4. Execute a rapid double-click (`dblclick` / two consecutive clicks with 0ms delay) on "Place Order".
  5. In a second run, fill form and rapidly press the `Enter` key twice in quick succession within the "Full Name" input.
* **Expected Result**:
  - On the first submit event, synchronous submission lock engages immediately.
  - The submit button is immediately disabled.
  - Exactly ONE confirmation box (`role="status"`, `data-testid="order-confirmation"`) is created.
  - The order reference ID (`ORD-XXXXXXX`) is immutable and does not flicker or regenerate.
  - Zero console errors or network duplication.
* **Evidence**: Screenshot captured at [`./evidence/02-rapid-double-click.png`](./evidence/02-rapid-double-click.png).

---

## 7. Defect Management & Reporting Guidelines

* **Defect Classification Standard**:
  * **Blocker**: Crash, NaN calculation, data corruption, double order generation.
  * **Critical**: Validation bypass, failure to preserve user inputs on error.
  * **Major**: Calculation formatting drift, missing accessible roles.
  * **Minor**: Visual alignment or styling discrepancies.
* **Reporting Standard**: All reported defect records in `TEST_RESULTS.md` must stem directly from execution logs or manual browser observation on this machine. If no defects occur, document as "No defects were found during automated or manual testing."
