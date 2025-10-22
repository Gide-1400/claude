import os
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Verify Registration Page
    page.goto('file://' + os.path.abspath('public/pages/auth/register.html'))
    page.fill('#register-name', 'Test User')
    page.fill('#register-email', 'test@example.com')
    page.fill('#register-phone', '1234567890')
    page.fill('#register-password', 'password123')
    page.fill('#register-confirm-password', 'password123')
    page.screenshot(path='jules-scratch/verification/register_page.png')

    # Verify Login Page
    page.goto('file://' + os.path.abspath('public/pages/auth/login.html'))
    page.fill('#login-email', 'test@example.com')
    page.fill('#login-password', 'password123')
    page.screenshot(path='jules-scratch/verification/login_page.png')

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
