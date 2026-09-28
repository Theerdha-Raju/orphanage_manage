"""
Configuration and WebDriver setup for Selenium automated tests.
"""
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

BASE_URL = os.environ.get("BASE_URL", "http://localhost:5173")
BACKEND_API_URL = os.environ.get("BACKEND_API_URL", "http://localhost:8000/api")
DEFAULT_TIMEOUT = 12

# Standard test credentials seeded in the database
TEST_ACCOUNTS = {
    "admin": {
        "email": "admin@orphanage.com",
        "password": "Admin@123",
        "name": "Alexander Wright",
        "expected_role": "admin",
        "expected_path": "/admin-dashboard",
    },
    "staff": {
        "email": "staff@orphanage.com",
        "password": "Staff@123",
        "name": "Sarah Jenkins",
        "expected_role": "staff",
        "expected_path": "/staff-dashboard",
    },
    "donor": {
        "email": "donor@orphanage.com",
        "password": "Donor@123",
        "name": "Eleanor Vance",
        "expected_role": "donor",
        "expected_path": "/donor-dashboard",
    },
    "volunteer": {
        "email": "volunteer@orphanage.com",
        "password": "Volunteer@123",
        "name": "Marcus Brody",
        "expected_role": "volunteer",
        "expected_path": "/volunteer-dashboard",
    },
    "child": {
        "email": "student@orphanage.com",
        "password": "Student@123",
        "name": "Leo Carter",
        "expected_role": "child",
        "expected_path": "/child-dashboard",
    },
}

SCREENSHOT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "reports", "screenshots")
)
os.makedirs(SCREENSHOT_DIR, exist_ok=True)


def get_chrome_driver(headless: bool = True) -> webdriver.Chrome:
    """Creates and configures a Chrome WebDriver instance."""
    opts = Options()
    if headless:
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--disable-extensions")
    opts.add_argument("--disable-notifications")
    opts.add_argument("--ignore-certificate-errors")
    opts.add_argument("--log-level=3")

    driver = webdriver.Chrome(options=opts)
    driver.implicitly_wait(DEFAULT_TIMEOUT)
    return driver
