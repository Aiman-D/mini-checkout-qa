import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Successful checkout produces a single confirmation', async ({ page }) => {
    // Add items to cart
    await page.getByRole('button', { name: 'Add Ceramic Coffee Mug to cart' }).click();
    await page.getByRole('button', { name: 'Add Canvas Tote Bag to cart' }).click();

    // Enter valid Full Name
    await page.getByLabel('Full Name').fill('Alex Rivera');

    // Click Place Order
    await page.getByRole('button', { name: 'Place Order' }).click();

    // Assert exactly 1 confirmation panel (role='status', data-testid='order-confirmation') is visible
    const confirmationPanel = page.getByRole('status');
    await expect(confirmationPanel).toHaveCount(1);
    await expect(confirmationPanel).toBeVisible();
    await expect(confirmationPanel).toHaveAttribute('data-testid', 'order-confirmation');

    // Assert visible order reference matches /^ORD-[A-Z0-9]{6,8}$/
    const orderReference = page.getByTestId('order-reference');
    await expect(orderReference).toBeVisible();
    await expect(orderReference).toHaveText(/^ORD-[A-Z0-9]{6,8}$/);

    // Assert customer name and exact formatted total are visible
    const customerName = page.getByTestId('confirmed-name');
    await expect(customerName).toBeVisible();
    await expect(customerName).toHaveText('Alex Rivera');

    const confirmedTotal = page.getByTestId('confirmed-total');
    await expect(confirmedTotal).toBeVisible();
    await expect(confirmedTotal).toHaveText('$37.25');
  });

  test('Missing required field blocks checkout and preserves state', async ({ page }) => {
    // Add item to cart
    await page.getByRole('button', { name: 'Add Ceramic Coffee Mug to cart' }).click();
    const orderTotal = page.getByTestId('order-total');
    await expect(orderTotal).toHaveText('$14.50');

    const customerNameInput = page.getByLabel('Full Name');
    const placeOrderButton = page.getByRole('button', { name: 'Place Order' });
    const alertMessage = page.getByRole('alert');
    const confirmationPanel = page.getByTestId('order-confirmation');

    // Case 1: Empty Full Name
    await customerNameInput.fill('');
    await placeOrderButton.click();

    // Assert visible role='alert' validation message
    await expect(alertMessage).toBeVisible();
    await expect(alertMessage).toContainText('Please enter your full name');

    // Assert confirmation panel has count 0 / is not visible
    await expect(confirmationPanel).toHaveCount(0);

    // Assert added items and total are still preserved on screen
    await expect(page.getByTestId('cart-item-ceramic-coffee-mug')).toBeVisible();
    await expect(orderTotal).toHaveText('$14.50');

    // Case 2: Whitespace-only Full Name ('   ')
    await customerNameInput.fill('   ');
    await placeOrderButton.click();

    // Assert visible role='alert' validation message
    await expect(alertMessage).toBeVisible();
    await expect(alertMessage).toContainText('Please enter your full name');

    // Assert confirmation panel has count 0 / is not visible
    await expect(confirmationPanel).toHaveCount(0);

    // Assert added items, input value, and total are still preserved on screen
    await expect(customerNameInput).toHaveValue('   ');
    await expect(page.getByTestId('cart-item-ceramic-coffee-mug')).toBeVisible();
    await expect(orderTotal).toHaveText('$14.50');
  });

  test('Quantity change updates line totals and exact order total', async ({ page }) => {
    // Add both products
    await page.getByRole('button', { name: 'Add Ceramic Coffee Mug to cart' }).click();
    await page.getByRole('button', { name: 'Add Canvas Tote Bag to cart' }).click();

    const mugLineTotal = page.getByTestId('line-total-ceramic-coffee-mug');
    const toteLineTotal = page.getByTestId('line-total-canvas-tote-bag');
    const orderTotal = page.getByTestId('order-total');

    // Change quantities: Ceramic Coffee Mug to 3 ($43.50), Canvas Tote Bag to 2 ($45.50)
    const mugQtyInput = page.getByLabel('Quantity of Ceramic Coffee Mug', { exact: true });
    await mugQtyInput.fill('3');
    await mugQtyInput.blur();

    const toteQtyInput = page.getByLabel('Quantity of Canvas Tote Bag', { exact: true });
    await toteQtyInput.fill('2');
    await toteQtyInput.blur();

    // Assert exact updated line totals and exact order total ($89.00)
    await expect(mugLineTotal).toHaveText('$43.50');
    await expect(toteLineTotal).toHaveText('$45.50');
    await expect(orderTotal).toHaveText('$89.00');

    // Decrement Ceramic Coffee Mug (from 3 to 2) using decrease button
    await page.getByRole('button', { name: 'Decrease quantity of Ceramic Coffee Mug' }).click();
    await expect(mugLineTotal).toHaveText('$29.00');
    await expect(orderTotal).toHaveText('$74.50');

    // Remove Canvas Tote Bag using remove button
    await page.getByRole('button', { name: 'Remove Canvas Tote Bag' }).click();
    await expect(page.getByTestId('cart-item-canvas-tote-bag')).toHaveCount(0);

    // Assert recalculated exact total updates accurately
    await expect(mugLineTotal).toHaveText('$29.00');
    await expect(orderTotal).toHaveText('$29.00');
  });
});
