from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:8000/pages/auth/register.html')
    page.screenshot(path='jules-scratch/verification/register_page.png')
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
