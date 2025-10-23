
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        # 1. Homepage
        await page.goto("http://localhost:8000/")

        # 2. Login Page
        await page.goto("http://localhost:8000/pages/auth/login.html")
        await page.fill("#login-email", "testuser@example.com")
        await page.fill("#login-password", "password123")
        await page.click("button[type='submit']")
        await page.wait_for_load_state("networkidle")

        # 3. Carrier Dashboard
        await page.goto("http://localhost:8000/pages/carrier/index.html")

        # 4. Add Trip Page
        await page.goto("http://localhost:8000/pages/carrier/add-trip.html")

        await browser.close()

        if console_errors:
            print("Console errors found:")
            for error in console_errors:
                print(error)
        else:
            print("No console errors found. All fixes verified successfully.")

asyncio.run(main())
