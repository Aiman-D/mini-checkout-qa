# E-Commerce Cart & Single-Page Checkout

A zero-dependency vanilla HTML/CSS/JavaScript e-commerce cart and checkout web application with idempotency guarantees and Playwright test coverage.

---

## Overview

This project implements an e-commerce shopping cart and single-page checkout flow built with vanilla web standards and native Node.js. It features integer-cents currency arithmetic to eliminate floating-point rounding errors, accessible form validation, synchronous idempotency locks against double-submission races, and automated browser verification.

### Key Capabilities
* **Integer Cents Calculations**: All item prices and totals are calculated and maintained in integer cents (Ceramic Coffee Mug @ 1450¢, Canvas Tote Bag @ 2275¢), preventing IEEE 754 floating-point drift.
* **Synchronous Idempotency Protection**: Immediate in-memory submission locking prevents duplicate orders upon rapid double-clicks, triple-clicks, or double-Enter keystrokes.
* **Accessible Validation & State Preservation**: Validates missing names, whitespace-only entries, and empty cart submissions using `role="alert"`, while preserving user inputs and cart line items on failure.
* **Zero External Production Dependencies**: Uses native ES modules, vanilla CSS, and Node's built-in `http` module.
* **Automated & Exploratory Testing**: Playwright test suite using web-first assertions with zero arbitrary sleep calls, supplemented by browser screenshot evidence.

---

## Directory Structure

```text
fyndhac/
├── evidence/                       # Visual test artifacts and verification screenshots
│   ├── 01-empty-cart-blocked.png   # Evidence: empty cart checkout validation block
│   └── 02-rapid-double-click.png   # Evidence: double-click submission lock verification
├── public/                         # Frontend client application
│   ├── app.js                      # Application logic, cart state, currency math & checkout lock
│   ├── index.html                  # Semantic, accessible HTML5 layout
│   └── styles.css                  # Offline-first, responsive, high-contrast stylesheet
├── tests/                          # Playwright test suite
│   └── checkout.spec.js            # Core automated spec checks (100% web-first assertions)
├── package.json                    # Project configuration and npm run scripts
├── playwright.config.js            # Playwright browser runner configuration
├── server.js                       # Native Node.js static HTTP file server (port 3000)
├── README.md                       # Project overview, setup, and execution documentation
├── TEST_PLAN.md                    # Risk-prioritized QA test plan & manual test protocols
└── TEST_RESULTS.md                 # Real execution metrics, environment info, & defect audit
```

---

## Prerequisites

* **Node.js**: `v18.0.0` or higher (tested on `v26.12.1`)
* **npm**: `v9.0.0` or higher (packaged with Node.js)
* **Operating System**: macOS, Linux, or Windows

---

## Setup & Run Commands

### 1. Install Dependencies
Install Playwright test runner and download the Chromium browser binary:
```bash
npm install
npx playwright install chromium
```

### 2. Start the Web Server
Launch the native zero-dependency static server:
```bash
npm start
```
The application will be served at [http://localhost:3000](http://localhost:3000).

### 3. Run Automated Tests
Execute the end-to-end Playwright test suite in headless mode (Playwright will automatically start and stop the local web server):
```bash
npm test
```

### 4. Run Headed Tests
Launch the test suite in headed Chromium to visually inspect test interactions:
```bash
npm run test:headed
```

### 5. View Test Reports
Open the interactive Playwright HTML report summarizing test execution:
```bash
npm run test:report
```

---

## Quality Assurance & Verification Links

* [**TEST_PLAN.md**](./TEST_PLAN.md): Detailed risk matrix (P0/P1/P2), automated test mappings, and exploratory test protocols.
* [**TEST_RESULTS.md**](./TEST_RESULTS.md): Execution metrics from this machine, automated suite results table, console error audit, and defect log.
* [**evidence/**](./evidence/): Directory containing browser screenshot artifacts:
  * [01-empty-cart-blocked.png](./evidence/01-empty-cart-blocked.png)
  * [02-rapid-double-click.png](./evidence/02-rapid-double-click.png)
