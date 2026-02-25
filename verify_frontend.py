from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 720})
    page = context.new_page()

    # Go to the chat page
    # Assuming the server is running on localhost:3000
    # and the route is /dashboard/acheevy
    print("Navigating to /dashboard/acheevy...")
    try:
        page.goto("http://localhost:3000/dashboard/acheevy", timeout=60000)
    except Exception as e:
        print(f"Navigation failed: {e}")
        # Try root just in case
        print("Retrying with root /...")
        page.goto("http://localhost:3000/", timeout=60000)

    # Wait for content to load
    # Look for "Message ACHEEVY" placeholder or similar
    try:
        print("Waiting for chat interface...")
        page.wait_for_selector("textarea[placeholder*='Message ACHEEVY']", timeout=30000)
        print("Chat interface found.")
    except Exception as e:
        print(f"Chat interface not found: {e}")

    # Take screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification_chat.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
