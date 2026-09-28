"""
Test actual login submit for all 5 roles: admin, staff, donor, volunteer, student.
Verifies that clicking a role pill, then submitting, lands on the correct dashboard.
"""
import time
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from selenium_tests.config import get_chrome_driver, BASE_URL
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

TEST_CASES = [
    {
        'role_label': 'Administrator',
        'role_btn_text': 'Admin',
        'email': 'admin@orphanage.com',
        'password': 'Admin@123',
        'expected_path': '/admin-dashboard',
    },
    {
        'role_label': 'Caregiver',
        'role_btn_text': 'Caregiver',
        'email': 'staff@orphanage.com',
        'password': 'Staff@123',
        'expected_path': '/staff-dashboard',
    },
    {
        'role_label': 'Donor',
        'role_btn_text': 'Donor',
        'email': 'donor@orphanage.com',
        'password': 'Donor@123',
        'expected_path': '/donor-dashboard',
    },
    {
        'role_label': 'Volunteer',
        'role_btn_text': 'Volunteer',
        'email': 'volunteer@orphanage.com',
        'password': 'Volunteer@123',
        'expected_path': '/volunteer-dashboard',
    },
    {
        'role_label': 'Student',
        'role_btn_text': 'Student',
        'email': 'student@orphanage.com',
        'password': 'Student@123',
        'expected_path': '/child-dashboard',
    },
]


def clear_auth_and_go_to_login(driver, wait):
    """Clear localStorage on a neutral page first to avoid auto-redirect on /login."""
    # Go to home page (not /login) so the React Navigate guard doesn't fire
    driver.get(f"{BASE_URL}/")
    time.sleep(0.5)
    # Clear all auth state
    driver.execute_script("localStorage.clear(); sessionStorage.clear();")
    driver.delete_all_cookies()
    time.sleep(0.3)
    # Now it's safe to navigate to /login
    driver.get(f"{BASE_URL}/login")
    # Wait for the login form to appear
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'form')))
    time.sleep(0.5)


def run():
    driver = get_chrome_driver(headless=True)
    wait = WebDriverWait(driver, 15)
    all_passed = True
    results = []

    try:
        for tc in TEST_CASES:
            label = tc['role_label']
            print(f"\n=== Testing Role: {label} ===")

            try:
                # 1. Clear auth and navigate safely to login page
                clear_auth_and_go_to_login(driver, wait)

                # 2. Click the role pill button
                btn_text = tc['role_btn_text']
                role_btn = wait.until(
                    EC.element_to_be_clickable(
                        (By.XPATH,
                         f"//button[contains(@class,'orphanage-role-btn') and contains(normalize-space(.),'{btn_text}')]")
                    )
                )
                driver.execute_script("arguments[0].scrollIntoView(true);", role_btn)
                role_btn.click()
                time.sleep(0.4)

                # 3. Verify email field is populated
                email_input = driver.find_element(By.NAME, 'email')
                current_email = email_input.get_attribute('value')
                print(f"  Email auto-filled: {current_email}")

                # 4. Make sure dropdown is closed (click elsewhere)
                driver.find_element(By.TAG_NAME, 'body').click()
                time.sleep(0.3)

                # 5. Clear email and type the target email
                email_input.clear()
                email_input.send_keys(tc['email'])

                # 6. Set password
                pwd_input = driver.find_element(By.NAME, 'password')
                pwd_input.clear()
                pwd_input.send_keys(tc['password'])

                # 7. Submit via JavaScript click to bypass any overlay
                submit_btn = wait.until(
                    EC.presence_of_element_located(
                        (By.CSS_SELECTOR, 'button[type="submit"].orphanage-submit-btn')
                    )
                )
                driver.execute_script("arguments[0].click();", submit_btn)
                print(f"  Submitted login for {tc['email']}")

                # 8. Wait for redirect
                wait.until(EC.url_contains(tc['expected_path']))
                final_url = driver.current_url
                print(f"  Redirected to: {final_url}")
                assert tc['expected_path'] in final_url, f"Expected {tc['expected_path']}, got {final_url}"
                print(f"  => {label} LOGIN TEST PASSED [OK]")
                results.append((label, True, final_url))

            except Exception as e:
                final_url = driver.current_url
                print(f"  FAILED: {e}")
                print(f"  Current URL: {final_url}")
                results.append((label, False, str(e)[:120]))
                all_passed = False

    finally:
        driver.quit()

    print("\n" + "=" * 55)
    print("FINAL RESULTS:")
    print("=" * 55)
    for (lbl, passed, info) in results:
        status = "PASS" if passed else "FAIL"
        print(f"  [{status}] {lbl:15s} | {info}")
    print("=" * 55)

    if all_passed:
        print("ALL 5 ROLE LOGIN TESTS PASSED!")
    else:
        failed = [r[0] for r in results if not r[1]]
        print(f"FAILED ROLES: {', '.join(failed)}")

    print("=" * 55)
    return all_passed


if __name__ == "__main__":
    success = run()
    sys.exit(0 if success else 1)
