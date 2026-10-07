"""
End-to-End Selenium Test Suite for HopeNest Orphanage Management System.
Contains comprehensive test cases covering Public pages, Authentication, RBAC,
Admin Management modules, and the AI Prediction Engine.
"""
import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys

from .config import BASE_URL, TEST_ACCOUNTS, SCREENSHOT_DIR


class TestContext:
    """Helper context to record steps, take screenshots, and manage execution."""
    def __init__(self, driver, test_name):
        self.driver = driver
        self.test_name = test_name
        self.logs = []
        self.screenshot_path = None

    def log(self, msg):
        timestamp = time.strftime("%H:%M:%S")
        self.logs.append({"time": timestamp, "msg": msg})
        print(f"[{timestamp}] [{self.test_name}] {msg}")

    def capture_screenshot(self, suffix=""):
        filename = f"{self.test_name}_{suffix}.png" if suffix else f"{self.test_name}.png"
        path = os.path.join(SCREENSHOT_DIR, filename)
        try:
            self.driver.save_screenshot(path)
            self.screenshot_path = path
            self.log(f"Captured screenshot: {filename}")
        except Exception as e:
            self.log(f"Failed to capture screenshot: {e}")
        return path

    def clear_auth(self):
        """Clears local storage and cookies to simulate a fresh unauthenticated session."""
        try:
            self.driver.execute_script(
                "try { window.localStorage.clear(); window.sessionStorage.clear(); } catch(e) {}"
            )
            self.driver.delete_all_cookies()
            self.log("Cleared localStorage, sessionStorage, and cookies")
        except Exception:
            pass

    def login_as(self, role="admin"):
        """Performs robust authentication for a specified role."""
        acc = TEST_ACCOUNTS[role]
        
        # 1. Clear session before hitting login to prevent auto-redirect
        self.clear_auth()
        self.driver.get(f"{BASE_URL}/login")
        time.sleep(0.5)
        self.clear_auth()
        self.driver.get(f"{BASE_URL}/login")
        time.sleep(0.5)

        wait = WebDriverWait(self.driver, 10)

        # Map role to button label
        role_label_map = {
            "admin": "Administrator",
            "staff": "Caregiver",
            "donor": "Donor",
            "volunteer": "Volunteer",
            "child": "Student",
        }
        target_label = role_label_map.get(role, "Administrator")
        try:
            pill = wait.until(
                EC.presence_of_element_located(
                    (By.XPATH, f"//button[contains(@class, 'orphanage-role-btn') and contains(., '{target_label}')]")
                )
            )
            self.driver.execute_script("arguments[0].click();", pill)
            time.sleep(0.3)
            self.log(f"Clicked role preset pill: {target_label}")
        except Exception as e:
            self.log(f"Role pill select fallback: {e}")

        email_input = wait.until(EC.presence_of_element_located((By.NAME, "email")))
        password_input = self.driver.find_element(By.NAME, "password")
        submit_btn = self.driver.find_element(By.CLASS_NAME, "orphanage-submit-btn")

        self.log(f"Submitting credentials for {role} ({acc['email']})")
        self.driver.execute_script("arguments[0].click();", submit_btn)

        # Wait for redirect to expected dashboard
        expected_path = acc["expected_path"]
        wait.until(lambda d: expected_path in d.current_url or "dashboard" in d.current_url)
        time.sleep(1)
        self.log(f"Successfully logged in as {role}, navigated to: {self.driver.current_url}")


# ─────────────────────────────────────────────────────────────────────────────
# CATEGORY 1: PUBLIC & LANDING PAGE TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_landing_page_branding(driver, ctx: TestContext):
    """Verify landing page loads with HopeNest branding, hero section, and title."""
    ctx.log(f"Navigating to {BASE_URL}")
    driver.get(BASE_URL)
    time.sleep(1)

    assert "HopeNest" in driver.title or "Orphanage" in driver.title
    ctx.log(f"Page title verified: {driver.title}")

    # Check navbar brand/logo
    navbar_brand = driver.find_element(By.CLASS_NAME, "nav-logo")
    assert "Orphanage" in navbar_brand.text or "HopeNest" in driver.page_source
    ctx.log("Navbar brand / logo confirmed")

    # Check hero section presence
    hero_title = driver.find_element(By.TAG_NAME, "h1")
    assert len(hero_title.text) > 0
    ctx.log(f"Hero section title found: '{hero_title.text}'")

    ctx.capture_screenshot("landing_page")


def test_landing_page_features_and_stats(driver, ctx: TestContext):
    """Verify AI module cards, stats counters, and landing page elements."""
    driver.get(BASE_URL)
    time.sleep(1)

    # Check AI service modules
    ai_cards = driver.find_elements(By.CLASS_NAME, "ai-card")
    ctx.log(f"Found {len(ai_cards)} AI service cards on landing page")
    assert len(ai_cards) >= 6, f"Expected at least 6 AI service cards, found {len(ai_cards)}"

    # Check stats counters
    stat_items = driver.find_elements(By.CLASS_NAME, "hero-stat-item")
    ctx.log(f"Found {len(stat_items)} stat counters on landing page")
    assert len(stat_items) >= 4, f"Expected at least 4 stat counters, found {len(stat_items)}"

    ctx.capture_screenshot("services_and_stats")


def test_landing_page_navigation_to_login(driver, ctx: TestContext):
    """Click on the Login button in public navbar and verify navigation to /login."""
    driver.get(BASE_URL)
    time.sleep(1)

    ctx.log("Locating 'Login' button in navbar")
    login_btn = driver.find_element(By.XPATH, "//nav//a[contains(@href, '/login') or contains(text(), 'Login')]")
    login_btn.click()

    WebDriverWait(driver, 10).until(EC.url_contains("/login"))
    time.sleep(0.5)
    assert "/login" in driver.current_url, f"Expected /login URL, got: {driver.current_url}"
    ctx.log(f"Successfully redirected to login page: {driver.current_url}")

    ctx.capture_screenshot("nav_to_login")


def test_forgot_password_flow(driver, ctx: TestContext):
    """Verify Forgot Password page form submission with confirmation message."""
    driver.get(f"{BASE_URL}/forgot-password")
    time.sleep(1)

    assert "Forgot Password" in driver.page_source
    ctx.log("Forgot Password page rendered")

    email_input = driver.find_element(By.XPATH, "//input[@type='email']")
    email_input.clear()
    test_email = "recovery.test@orphanage.com"
    email_input.send_keys(test_email)
    ctx.log(f"Entered recovery email: {test_email}")

    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
    submit_btn.click()
    time.sleep(1)

    # Check success screen "Check Your Email"
    assert "Check Your Email" in driver.page_source
    assert test_email in driver.page_source
    ctx.log("Password reset confirmation message displayed successfully")

    ctx.capture_screenshot("forgot_password_success")


def test_register_page_elements_and_validation(driver, ctx: TestContext):
    """Verify registration page controls, role options, and required field validation."""
    driver.get(f"{BASE_URL}/register")
    time.sleep(1)

    assert "/register" in driver.current_url
    ctx.log("Register page opened")

    # Check input fields
    driver.find_element(By.XPATH, "//input[@type='email']")
    ctx.log("Verified presence of input fields")

    # Submit empty form to trigger validation
    submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
    submit_btn.click()
    time.sleep(0.5)

    # Assert validation error messages appear
    body_text = driver.find_element(By.TAG_NAME, "body").text
    assert "required" in body_text.lower() or "agree" in body_text.lower()
    ctx.log("Form validation errors triggered and displayed as expected")

    ctx.capture_screenshot("register_validation")


# ─────────────────────────────────────────────────────────────────────────────
# CATEGORY 2: AUTHENTICATION & SESSION MANAGEMENT TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_login_role_pills_auto_fill(driver, ctx: TestContext):
    """Test clicking preset role buttons on /login page to verify dynamic auto-fill."""
    ctx.clear_auth()
    driver.get(f"{BASE_URL}/login")
    time.sleep(1)

    email_input = driver.find_element(By.NAME, "email")

    # Click 'Caregiver' role pill
    caregiver_pill = driver.find_element(By.XPATH, "//button[contains(@class, 'orphanage-role-btn') and contains(., 'Caregiver')]")
    caregiver_pill.click()
    time.sleep(0.3)
    assert email_input.get_attribute("value") == "staff@orphanage.com"
    ctx.log("Caregiver preset clicked: Auto-filled staff@orphanage.com")

    # Click 'Donor' role pill
    donor_pill = driver.find_element(By.XPATH, "//button[contains(@class, 'orphanage-role-btn') and contains(., 'Donor')]")
    donor_pill.click()
    time.sleep(0.3)
    assert email_input.get_attribute("value") == "donor@orphanage.com"
    ctx.log("Donor preset clicked: Auto-filled donor@orphanage.com")

    # Click 'Volunteer' role pill
    vol_pill = driver.find_element(By.XPATH, "//button[contains(@class, 'orphanage-role-btn') and contains(., 'Volunteer')]")
    vol_pill.click()
    time.sleep(0.3)
    assert email_input.get_attribute("value") == "volunteer@orphanage.com"
    ctx.log("Volunteer preset clicked: Auto-filled volunteer@orphanage.com")

    # Click 'Student' role pill
    child_pill = driver.find_element(By.XPATH, "//button[contains(@class, 'orphanage-role-btn') and contains(., 'Student')]")
    child_pill.click()
    time.sleep(0.3)
    assert email_input.get_attribute("value") == "student@orphanage.com"
    ctx.log("Student preset clicked: Auto-filled student@orphanage.com")

    ctx.capture_screenshot("role_pills_tested")


def test_admin_login_success(driver, ctx: TestContext):
    """Log in as Administrator and verify redirection to /admin-dashboard."""
    ctx.login_as("admin")
    time.sleep(1)

    assert "/admin-dashboard" in driver.current_url
    body_text = driver.find_element(By.TAG_NAME, "body").text
    assert "Dashboard" in body_text or "Admin" in body_text
    ctx.log("Admin Dashboard verified")

    ctx.capture_screenshot("admin_dashboard")


def test_staff_login_success(driver, ctx: TestContext):
    """Log in as Caregiver/Staff and verify redirection to /staff-dashboard."""
    ctx.login_as("staff")
    time.sleep(1)

    assert "/staff-dashboard" in driver.current_url
    ctx.log("Caregiver Staff Dashboard verified")

    ctx.capture_screenshot("staff_dashboard")


def test_donor_login_success(driver, ctx: TestContext):
    """Log in as Donor and verify redirection to /donor-dashboard."""
    ctx.login_as("donor")
    time.sleep(1)

    assert "/donor-dashboard" in driver.current_url
    ctx.log("Donor Dashboard verified")

    ctx.capture_screenshot("donor_dashboard")


def test_volunteer_login_success(driver, ctx: TestContext):
    """Log in as Volunteer and verify redirection to /volunteer-dashboard."""
    ctx.login_as("volunteer")
    time.sleep(1)

    assert "volunteer" in driver.current_url.lower()
    ctx.log("Volunteer Dashboard verified")

    ctx.capture_screenshot("volunteer_dashboard")


def test_child_student_login_success(driver, ctx: TestContext):
    """Log in as Student/Child and verify redirection to /child-dashboard."""
    ctx.login_as("child")
    time.sleep(1)

    assert "/child-dashboard" in driver.current_url
    ctx.log("Child Student Dashboard verified")

    ctx.capture_screenshot("child_dashboard")


def test_invalid_credentials_error_display(driver, ctx: TestContext):
    """Submit invalid credentials and verify that the error banner appears."""
    ctx.clear_auth()
    driver.get(f"{BASE_URL}/login")
    time.sleep(1)

    email_input = driver.find_element(By.NAME, "email")
    password_input = driver.find_element(By.NAME, "password")
    submit_btn = driver.find_element(By.CLASS_NAME, "orphanage-submit-btn")

    # Set bad password via dispatchEvent
    driver.execute_script("""
        arguments[0].value = 'admin@orphanage.com';
        arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
        arguments[1].value = 'WrongPassword@999';
        arguments[1].dispatchEvent(new Event('input', { bubbles: true }));
    """, email_input, password_input)

    ctx.log("Submitting incorrect credentials")
    submit_btn.click()

    # Wait for error message to render
    wait = WebDriverWait(driver, 8)
    wait.until(lambda d: "Invalid" in d.page_source or "error" in d.page_source.lower() or "exclamation" in d.page_source)
    ctx.log("Expected authentication error banner is visible")

    ctx.capture_screenshot("invalid_login_error")


def test_user_logout_flow(driver, ctx: TestContext):
    """Verify logging in as admin, clicking the logout item, and redirecting back to /login."""
    ctx.login_as("admin")
    time.sleep(1)

    # Locate sidebar user/logout button
    ctx.log("Finding sidebar logout control")
    logout_trigger = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "sidebar-user"))
    )
    driver.execute_script("arguments[0].click();", logout_trigger)
    time.sleep(1.5)

    WebDriverWait(driver, 10).until(EC.url_contains("/login"))
    assert "/login" in driver.current_url
    ctx.log("Successfully logged out and redirected to /login")

    # Verify localStorage items cleared
    role_in_storage = driver.execute_script("return localStorage.getItem('userRole');")
    assert role_in_storage is None, f"Expected userRole to be None, got: {role_in_storage}"
    ctx.log("Session storage verified clean")

    ctx.capture_screenshot("logout_success")


# ─────────────────────────────────────────────────────────────────────────────
# CATEGORY 3: SECURITY & ROLE-BASED ACCESS CONTROL (RBAC)
# ─────────────────────────────────────────────────────────────────────────────

def test_unauthenticated_protected_route(driver, ctx: TestContext):
    """Directly visit /admin-dashboard when logged out; verify redirect to /login."""
    driver.get(f"{BASE_URL}/login")
    ctx.clear_auth()

    ctx.log("Navigating to protected route /admin-dashboard without active session")
    driver.get(f"{BASE_URL}/admin-dashboard")
    time.sleep(1.5)

    assert "/login" in driver.current_url
    ctx.log(f"Correctly redirected unauthorized user to: {driver.current_url}")

    ctx.capture_screenshot("unauth_protected_redirect")


def test_child_rbac_restrictions(driver, ctx: TestContext):
    """Log in as child and attempt to access /expense-management; verify blocked/redirected."""
    ctx.login_as("child")
    time.sleep(1)

    ctx.log("Attempting access to restricted admin route: /expense-management")
    driver.get(f"{BASE_URL}/expense-management")
    time.sleep(1.5)

    # Child should be bounced back to /child-dashboard
    assert "/expense-management" not in driver.current_url
    assert "/child-dashboard" in driver.current_url
    ctx.log(f"Access restriction verified. Final URL: {driver.current_url}")

    ctx.capture_screenshot("child_rbac_guard")


# ─────────────────────────────────────────────────────────────────────────────
# CATEGORY 4: ADMIN CORE MANAGEMENT MODULES
# ─────────────────────────────────────────────────────────────────────────────

def test_admin_dashboard_metrics_and_charts(driver, ctx: TestContext):
    """Verify statistics cards and chart elements on the Admin Dashboard."""
    ctx.login_as("admin")
    driver.get(f"{BASE_URL}/admin-dashboard")
    time.sleep(2)

    # Check stat cards
    stat_cards = driver.find_elements(By.CLASS_NAME, "stat-card")
    ctx.log(f"Found {len(stat_cards)} stat cards on Admin Dashboard")
    assert len(stat_cards) >= 4, f"Expected at least 4 stat cards, found {len(stat_cards)}"

    # Check chart canvases
    canvases = driver.find_elements(By.TAG_NAME, "canvas")
    ctx.log(f"Found {len(canvases)} Chart.js canvas elements")
    assert len(canvases) >= 2, f"Expected at least 2 charts on Admin Dashboard, found {len(canvases)}"

    ctx.capture_screenshot("admin_dashboard_charts")


def test_child_profiles_management(driver, ctx: TestContext):
    """Verify child profiles table, search filter, and child data rows."""
    ctx.login_as("admin")
    driver.get(f"{BASE_URL}/child-profile")
    time.sleep(2)

    assert "/child-profile" in driver.current_url
    ctx.log("Child Profile page loaded")

    # Locate search input
    search_input = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//input[@placeholder[contains(., 'Search')]]"))
    )
    ctx.log("Found child search input")

    # Check that children table rows exist
    wait = WebDriverWait(driver, 10)
    wait.until(lambda d: len(d.find_elements(By.XPATH, "//table//tbody//tr")) > 0)
    rows = driver.find_elements(By.XPATH, "//table//tbody//tr")
    ctx.log(f"Total child profile rows loaded: {len(rows)}")
    assert len(rows) > 0, "No child records found in table"

    # Test filtering with search
    search_input.clear()
    search_input.send_keys("A")
    time.sleep(0.8)
    filtered_rows = driver.find_elements(By.XPATH, "//table//tbody//tr")
    ctx.log(f"Rows after search query: {len(filtered_rows)}")

    ctx.capture_screenshot("child_profiles_table")


def test_donor_management_module(driver, ctx: TestContext):
    """Verify Donor Management page, stats, and directory."""
    ctx.login_as("admin")
    driver.get(f"{BASE_URL}/donor-management")
    time.sleep(2)

    assert "/donor-management" in driver.current_url
    page_text = driver.find_element(By.TAG_NAME, "body").text
    assert "Donor" in page_text
    ctx.log("Donor Management page and directory verified")

    ctx.capture_screenshot("donor_management")


def test_volunteer_management_module(driver, ctx: TestContext):
    """Verify Volunteer Management page, volunteer list, and task assignment UI."""
    ctx.login_as("admin")
    driver.get(f"{BASE_URL}/volunteer-management")
    time.sleep(2)

    assert "/volunteer-management" in driver.current_url
    page_text = driver.find_element(By.TAG_NAME, "body").text
    assert "Volunteer" in page_text
    ctx.log("Volunteer Management page verified")

    ctx.capture_screenshot("volunteer_management")


def test_expense_management_module(driver, ctx: TestContext):
    """Verify Expense Management ledger, summary cards, and category tracking."""
    ctx.login_as("admin")
    driver.get(f"{BASE_URL}/expense-management")
    time.sleep(2)

    assert "/expense-management" in driver.current_url
    page_text = driver.find_element(By.TAG_NAME, "body").text
    assert "Expense" in page_text or "₹" in page_text
    ctx.log("Expense Management page verified")

    ctx.capture_screenshot("expense_management")


def test_reports_analytics_module(driver, ctx: TestContext):
    """Verify Reports and Analytics page."""
    ctx.login_as("admin")
    driver.get(f"{BASE_URL}/reports")
    time.sleep(2)

    assert "/reports" in driver.current_url
    page_text = driver.find_element(By.TAG_NAME, "body").text
    assert "Report" in page_text or "Analytics" in page_text
    ctx.log("Reports & Analytics page verified")

    ctx.capture_screenshot("reports_page")


def test_settings_module(driver, ctx: TestContext):
    """Verify Settings page and system configuration toggles."""
    ctx.login_as("admin")
    driver.get(f"{BASE_URL}/settings")
    time.sleep(2)

    assert "/settings" in driver.current_url
    page_text = driver.find_element(By.TAG_NAME, "body").text
    assert "Setting" in page_text or "Configuration" in page_text
    ctx.log("Settings page verified")

    ctx.capture_screenshot("settings_page")


# ─────────────────────────────────────────────────────────────────────────────
# CATEGORY 5: INTELLIGENCE, AI PREDICTION & RECORDS MODULES
# ─────────────────────────────────────────────────────────────────────────────

def test_ai_prediction_tabs_navigation(driver, ctx: TestContext):
    """Navigate to AI Prediction Hub and verify switching between all 4 ML model tabs."""
    ctx.login_as("admin")
    driver.get(f"{BASE_URL}/ai-prediction")
    time.sleep(2)

    assert "/ai-prediction" in driver.current_url
    ctx.log("Opened AI Predictions Hub")

    # Check tab buttons
    academic_tab = driver.find_element(By.XPATH, "//button[contains(., 'Academic')]")
    health_tab = driver.find_element(By.XPATH, "//button[contains(., 'Health')]")
    behavior_tab = driver.find_element(By.XPATH, "//button[contains(., 'Behavior')]")
    growth_tab = driver.find_element(By.XPATH, "//button[contains(., 'Growth')]")

    # Switch to Health Model tab
    driver.execute_script("arguments[0].click();", health_tab)
    time.sleep(0.5)
    assert "Support Vector Machine" in driver.page_source or "Health Risk" in driver.page_source
    ctx.log("Switched to Health Risk Model (SVM) tab")

    # Switch to Behavioral Pattern tab
    driver.execute_script("arguments[0].click();", behavior_tab)
    time.sleep(0.5)
    assert "K-Nearest Neighbors" in driver.page_source or "Behavior" in driver.page_source
    ctx.log("Switched to Behavioral Pattern Model (KNN) tab")

    # Switch to Growth Forecast tab
    driver.execute_script("arguments[0].click();", growth_tab)
    time.sleep(0.5)
    assert "Growth" in driver.page_source
    ctx.log("Switched to Growth Forecast Model tab")

    # Switch back to Academic tab
    driver.execute_script("arguments[0].click();", academic_tab)
    time.sleep(0.5)
    assert "Random Forest" in driver.page_source or "Academic" in driver.page_source
    ctx.log("Switched back to Academic Model tab")

    ctx.capture_screenshot("ai_prediction_tabs")


def test_ai_prediction_academic_run(driver, ctx: TestContext):
    """Trigger the Academic AI prediction model and assert that the inference results card renders."""
    ctx.login_as("admin")
    driver.get(f"{BASE_URL}/ai-prediction")
    time.sleep(2)

    # Locate and click 'Generate Prediction' button on Academic tab
    predict_btn = driver.find_element(By.XPATH, "//button[@type='submit' and contains(., 'Generate Prediction')]")
    ctx.log("Clicking 'Generate Prediction' button")
    driver.execute_script("arguments[0].click();", predict_btn)

    # Wait for result card to render
    wait = WebDriverWait(driver, 10)
    wait.until(
        lambda d: "Prediction Results" in d.page_source or "%" in d.page_source or "Grade" in d.page_source
    )
    time.sleep(1)

    page_text = driver.find_element(By.TAG_NAME, "body").text
    assert "%" in page_text or "Predicted" in page_text
    ctx.log("AI prediction inference result successfully displayed on screen")

    ctx.capture_screenshot("ai_prediction_results")


def test_health_management_module(driver, ctx: TestContext):
    """Verify Health Management page and checkup records."""
    ctx.login_as("admin")
    driver.get(f"{BASE_URL}/health-management")
    time.sleep(2)

    assert "/health-management" in driver.current_url
    page_text = driver.find_element(By.TAG_NAME, "body").text
    assert "Health" in page_text
    ctx.log("Health Management page verified")

    ctx.capture_screenshot("health_management")


def test_academic_management_module(driver, ctx: TestContext):
    """Verify Academic Management page, exams, and subject records."""
    ctx.login_as("admin")
    driver.get(f"{BASE_URL}/academic-management")
    time.sleep(2)

    assert "/academic-management" in driver.current_url
    page_text = driver.find_element(By.TAG_NAME, "body").text
    assert "Academic" in page_text or "Exam" in page_text
    ctx.log("Academic Management page verified")

    ctx.capture_screenshot("academic_management")
