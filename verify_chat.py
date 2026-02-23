from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to dashboard...")
            page.goto("http://localhost:3000/dashboard")
            page.wait_for_timeout(5000)
            page.screenshot(path="dashboard.png")
            print("Dashboard screenshot taken")

            print("Navigating to chat...")
            page.goto("http://localhost:3000/chat")
            page.wait_for_timeout(5000)
            page.screenshot(path="chat.png")
            print("Chat screenshot taken")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
