import time
import os
from selenium_tests.config import get_chrome_driver, BASE_URL
from selenium.webdriver.common.by import By

def run():
    driver = get_chrome_driver(headless=True)
    try:
        driver.get(f"{BASE_URL}/login")
        time.sleep(1)

        roles = ["Caregiver", "Donor", "Volunteer", "Student"]
        
        for r in roles:
            print(f"\n=== Testing Role: {r} ===")
            # 1. Click role pill
            btn = driver.find_element(By.XPATH, f"//button[contains(@class, 'orphanage-role-btn') and contains(., '{r}')]")
            btn.click()
            time.sleep(0.4)
            
            # 2. Click email input or toggle chevron to open dropdown
            toggle_btn = driver.find_element(By.ID, "email-dropdown-toggle-btn")
            toggle_btn.click()
            time.sleep(0.4)
            
            # 3. Check items in dropdown
            items = driver.find_elements(By.CSS_SELECTOR, ".orphanage-dropdown-item")
            print(f"Found {len(items)} email options for {r}:")
            emails = []
            for it in items:
                name = it.find_element(By.CSS_SELECTOR, ".orphanage-acc-name").text
                des = it.find_element(By.CSS_SELECTOR, ".orphanage-acc-designation").text
                em = it.find_element(By.CSS_SELECTOR, ".orphanage-acc-email-text").text
                emails.append((name, des, em))
                print(f"  - {name} ({des}): {em}")
            
            assert len(items) >= 5, f"Expected at least 5 emails for {r}, got {len(items)}"
            
            # 4. Click on the 2nd account to test selection & auto-fill
            target_acc = emails[1]
            items[1].click()
            time.sleep(0.3)
            
            email_val = driver.find_element(By.NAME, "email").get_attribute("value")
            pwd_val = driver.find_element(By.NAME, "password").get_attribute("value")
            print(f"  Selected account: email={email_val}, pwd={pwd_val}")
            assert email_val == target_acc[2], f"Expected email {target_acc[2]}, got {email_val}"
            assert len(pwd_val) > 0, "Expected password to be filled"
            
            # Also test clicking input directly opens dropdown
            email_input = driver.find_element(By.ID, "login-email-input")
            email_input.click()
            time.sleep(0.3)
            reopened_items = driver.find_elements(By.CSS_SELECTOR, ".orphanage-dropdown-item")
            assert len(reopened_items) >= 5, "Dropdown should open when clicking email input"
            print(f"  Verified clicking input also opens the {len(reopened_items)} email choices.")
            
            # Close it by clicking toggle
            toggle_btn.click()
            time.sleep(0.2)
            
            print(f"  => {r} test PASSED successfully!")

        print("\n" + "="*50)
        print("ALL ROLE EMAIL DROPDOWN TESTS PASSED (>= 5 EMAILS PER ROLE)!")
        print("="*50)
    finally:
        driver.quit()

if __name__ == "__main__":
    run()
