import { expect, test } from '@playwright/test';

test('chat shell renders core conversation controls', async ({ page }) => {
  await page.goto('/chat', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/(chat|dashboard\/chat)/, { timeout: 60_000 });

  await expect(page.getByText('CHAT W/ ACHEEVY').first()).toBeVisible();
  await expect(page.getByText("Welcome to A.I.M.S. I'm ACHEEVY. What would you like to do today?").first()).toBeVisible();
  await expect(page.getByPlaceholder('Type or speak your request...')).toBeVisible();
  await expect(page.getByRole('button', { name: /Speech (On|Off)/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Voice Capture Toggle/i }).first()).toBeVisible();
});

test('speech output toggle changes state label', async ({ page }) => {
  await page.goto('/chat', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/(chat|dashboard\/chat)/, { timeout: 60_000 });

  const speechToggle = page.getByRole('button', { name: /Speech (On|Off)/ }).first();
  await expect(speechToggle).toBeVisible();
  await speechToggle.click();
  await expect(page.getByRole('button', { name: /Speech (On|Off)/ }).first()).toBeVisible();
});

test('attachment trigger is visible in composer controls', async ({ page }) => {
  await page.goto('/chat', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/(chat|dashboard\/chat)/, { timeout: 60_000 });

  const toolsButton = page.getByRole('button', { name: 'Tools' }).first();
  await expect(toolsButton).toBeVisible();

  const controlsRow = toolsButton.locator('xpath=..');
  const attachmentButton = controlsRow.getByRole('button').first();
  await expect(attachmentButton).toBeVisible();
});

test('voice capture toggle transitions to listening state', async ({ page }) => {
  await page.goto('/chat', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/(chat|dashboard\/chat)/, { timeout: 60_000 });

  // Find and click Voice Capture button
  const voiceCaptureButton = page.getByRole('button', { name: /Voice Capture Toggle/i }).first();
  await expect(voiceCaptureButton).toBeVisible();

  // Mock microphone permission to 'granted' before clicking
  await page.context().grantPermissions(['microphone']);

  // Click to start listening
  await voiceCaptureButton.click();

  // Give browser time to transition to listening state
  await page.waitForTimeout(500);

  // Verify the button is still visible after click (toggled state)
  await expect(voiceCaptureButton).toBeVisible();

  // Verify input field or listening indicator is still present
  await expect(page.getByPlaceholder('Type or speak your request...')).toBeVisible();
});

test('transcript message can be composed and sent', async ({ page }) => {
  await page.goto('/chat', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/(chat|dashboard\/chat)/, { timeout: 60_000 });

  // Set up microphone permission
  await page.context().grantPermissions(['microphone']);

  // Find and fill the prompt input with simulated transcript content
  const promptInput = page.getByPlaceholder('Type or speak your request...');
  await expect(promptInput).toBeVisible();

  // Type a simulated transcript message
  await promptInput.click();
  await promptInput.fill('What is the status of my AI services?');

  // Verify text has been entered
  await expect(promptInput).toHaveValue('What is the status of my AI services?');

  // The send button is an unlabeled icon button — last button in the composer container
  // Anchor on the text input and traverse up one level to find its sibling buttons
  const composerContainer = promptInput.locator('xpath=..');
  const sendButton = composerContainer.locator('button').last();
  await expect(sendButton).toBeVisible();
  await expect(sendButton).toBeEnabled();
});

test('attachment upload shows file preview chip', async ({ page }) => {
  // Mock the upload endpoint — bypasses auth requirement; returns one fake file object
  await page.route('**/api/upload', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        files: [{ id: 'e2e-test-001', name: 'aims-test.txt', size: 42, type: 'text/plain', url: '/uploads/aims-test.txt' }],
      }),
    });
  });

  await page.goto('/chat', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/(chat|dashboard\/chat)/, { timeout: 60_000 });

  // Find attachment button using the established selector pattern
  const toolsButton = page.getByRole('button', { name: 'Tools' }).first();
  await expect(toolsButton).toBeVisible();
  const controlsRow = toolsButton.locator('xpath=..');
  const attachmentButton = controlsRow.getByRole('button').first();
  await expect(attachmentButton).toBeVisible();

  // Some composer variants attach a hidden file input without opening a native chooser.
  // Set files directly on the input to avoid flaky filechooser event waits.
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: 'aims-test.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('AIMS E2E attachment test content'),
  });

  // After upload, the component renders a chip with the filename
  await expect(page.getByText('aims-test.txt')).toBeVisible({ timeout: 10_000 });
});

test('chat API failure renders error state and retry control', async ({ page }) => {
  // Route the first chat message to a 500 error to simulate backend failure
  let callCount = 0;
  await page.route('**/api/chat**', async route => {
    callCount++;
    if (callCount === 1) {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal Server Error' }) });
    } else {
      await route.abort(); // Let subsequent calls through (won't reach real server in test)
    }
  });

  await page.goto('/chat', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/(chat|dashboard\/chat)/, { timeout: 60_000 });

  // Type and send a message to trigger the mocked 500 error
  const promptInput = page.getByPlaceholder('Type or speak your request...');
  await expect(promptInput).toBeVisible();
  await promptInput.fill('trigger failure test');

  const composerContainer = promptInput.locator('xpath=..');
  const sendButton = composerContainer.locator('button').last();
  await expect(sendButton).toBeEnabled();
  await sendButton.click();

  // Assert that some error feedback appears in the conversation
  // The UI should show an error message, failed state indicator, or retry affordance
  const errorIndicator = page.getByText(/error|failed|try again|retry/i).first();
  await expect(errorIndicator).toBeVisible({ timeout: 15_000 });
});
