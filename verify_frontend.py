from playwright.sync_api import sync_playwright
import time

def run():
    print("Starting Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:3000")
            response = page.goto("http://localhost:3000")
            print(f"Response status: {response.status if response else 'None'}")

            print("Waiting for content...")
            # Wait for body load
            page.wait_for_selector('body', timeout=30000)
            print("Body loaded.")

            # Check title
            title = page.title()
            print(f"Page title: {title}")

            # Try to find a specific element from AcheevyChat
            # e.g., "Chat w/ACHEEVY"
            try:
                # Wait up to 10s
                page.wait_for_selector('text=Chat w/ACHEEVY', timeout=10000)
                print("Found 'Chat w/ACHEEVY'")
            except:
                print("Could not find 'Chat w/ACHEEVY'. Taking screenshot anyway.")

            time.sleep(5) # Allow rendering to stabilize
            page.screenshot(path="verification_frontend.png")
            print("Screenshot saved to verification_frontend.png")
        except Exception as e:
            print(f"Error: {e}")
            try:
                page.screenshot(path="verification_error.png")
            except:
                pass
        finally:
            browser.close()

if __name__ == "__main__":
    run()
