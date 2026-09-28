"""Quick targeted test for volunteer and student login from a guaranteed clean state."""
import time, sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from selenium_tests.config import get_chrome_driver, BASE_URL
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

TESTS = [
    ('Volunteer', 'volunteer@orphanage.com', 'Volunteer@123', '/volunteer-dashboard'),
    ('Student',   'student@orphanage.com',   'Student@123',   '/child-dashboard'),
]

def run():
    driver = get_chrome_driver(headless=True)
    wait = WebDriverWait(driver, 15)
    all_passed = True

    for label, email, pwd, expected in TESTS:
        print(f"\n=== {label} ===")
        # Force a truly clean state: open blank page, clear storage, then go to /login
        driver.get("about:blank")
        driver.execute_script("window.open('about:blank','_self')")
        time.sleep(0.2)
        driver.get(f"{BASE_URL}/login")
        time.sleep(0.5)
        # Clear localStorage now that we're on the page (but before React renders)
        driver.execute_script("localStorage.clear(); sessionStorage.clear();")
        driver.delete_all_cookies()
        driver.refresh()
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'form')))
        time.sleep(0.8)

        try:
            # Fill email
            email_input = driver.find_element(By.NAME, 'email')
            email_input.clear()
            email_input.send_keys(email)

            # Fill password
            pwd_input = driver.find_element(By.NAME, 'password')
            pwd_input.clear()
            pwd_input.send_keys(pwd)

            # Submit via JS to bypass any overlay
            submit_btn = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"].orphanage-submit-btn')
            driver.execute_script("arguments[0].click();", submit_btn)
            print(f"  Submitted {email}")

            wait.until(EC.url_contains(expected))
            final = driver.current_url
            print(f"  Redirected to: {final}")
            print(f"  => {label} PASSED [OK]")
        except Exception as e:
            print(f"  FAILED: {e}")
            print(f"  URL: {driver.current_url}")
            all_passed = False

    driver.quit()
    print("\n" + "=" * 40)
    print("ALL PASSED!" if all_passed else "SOME FAILED!")
    print("=" * 40)
    return all_passed

if __name__ == "__main__":
    sys.exit(0 if run() else 1)
