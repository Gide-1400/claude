
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:8000/pages/auth/register.html')

        # Click the 'shipper' user type option
        page.click('div[data-type="shipper"]')

        # Take a screenshot to verify the shipper-specific fields are visible
        page.screenshot(path='jules-scratch/verification/registration_fix_verification.png')

        browser.close()

if __name__ == '__main__':
    run()
