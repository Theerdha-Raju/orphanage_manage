import time
import sys
import os

sys.path.insert(0, os.path.abspath('.'))

from selenium_tests.config import get_chrome_driver

def check():
    driver = get_chrome_driver()
    try:
        driver.get('http://localhost:5173/login')
        time.sleep(3)
        print("Page Title:", driver.title)
        html = driver.page_source
        
        # Check if Google Identity Services iframe or button is rendered
        iframes = driver.find_elements('tag name', 'iframe')
        print(f"Total iframes on login page: {len(iframes)}")
        for idx, iframe in enumerate(iframes):
            src = iframe.get_attribute('src') or ''
            title = iframe.get_attribute('title') or ''
            print(f"  iframe {idx}: title='{title}', src='{src[:60]}...'")

        # Check buttons or text mentioning Google
        google_buttons = driver.find_elements('xpath', "//button[contains(., 'Google')] | //div[contains(@id, 'google') or contains(@class, 'google')]")
        print(f"Google elements found: {len(google_buttons)}")
        for el in google_buttons:
            print(f"  tag: {el.tag_name}, text: '{el.text}', id: '{el.get_attribute('id')}'")
            
    finally:
        driver.quit()

if __name__ == '__main__':
    check()
