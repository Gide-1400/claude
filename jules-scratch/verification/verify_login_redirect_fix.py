
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Mock the user session to simulate a logged-in state
        page.add_init_script("""
            window.localStorage.setItem('supabase.auth.token', JSON.stringify({
                "currentSession": {
                    "provider_token": null,
                    "provider_refresh_token": null,
                    "access_token": "mock_access_token",
                    "refresh_token": "mock_refresh_token",
                    "expires_in": 3600,
                    "expires_at": Math.floor(Date.now() / 1000) + 3600,
                    "user": {
                        "id": "mock_user_id",
                        "app_metadata": {},
                        "user_metadata": {},
                        "aud": "authenticated",
                        "email": "test@example.com",
                        "created_at": "2023-01-01T00:00:00Z",
                        "updated_at": "2023-01-01T00:00:00Z"
                    }
                },
                "expiresAt": Math.floor(Date.now() / 1000) + 3600
            }));
        """)

        page.goto('http://localhost:8000/index.html')

        # Wait for the DOM to be fully loaded and scripts to run
        page.wait_for_load_state('networkidle')

        # Take a screenshot to verify the hero buttons are hidden
        page.screenshot(path='jules-scratch/verification/login_redirect_fix_verification.png')

        browser.close()

if __name__ == '__main__':
    run()
