"""
Master Test Runner for Selenium Test Suite.
Executes all test scenarios, records metrics and logs, and compiles reports.
"""
import sys
import os
import time
import traceback

# Reconfigure stdout/stderr for unicode emojis on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from selenium_tests.config import get_chrome_driver, BASE_URL
from selenium_tests import test_suite
from selenium_tests.html_reporter import generate_html_report, generate_markdown_report


TEST_REGISTRY = [
    # Category 1: Public & Landing Page
    {
        "name": "Landing Page Branding & Hero",
        "category": "Public & Landing",
        "description": "Validates page title, HopeNest branding, header navigation bar, and hero section.",
        "func": test_suite.test_landing_page_branding,
    },
    {
        "name": "Landing Page Feature Modules & Metrics",
        "category": "Public & Landing",
        "description": "Verifies the 6 key service feature cards, live counter metrics, and testimonials on the homepage.",
        "func": test_suite.test_landing_page_features_and_stats,
    },
    {
        "name": "Landing Page CTA Navigation to Login",
        "category": "Public & Landing",
        "description": "Clicks navigation controls on the landing page and verifies redirection to /login.",
        "func": test_suite.test_landing_page_navigation_to_login,
    },
    {
        "name": "Self-Service Password Reset Request",
        "category": "Public & Landing",
        "description": "Submits an email for password recovery on /forgot-password and verifies the confirmation screen.",
        "func": test_suite.test_forgot_password_flow,
    },
    {
        "name": "Account Registration Form & Validation",
        "category": "Public & Landing",
        "description": "Verifies input controls, role selection, and client-side form validation on /register.",
        "func": test_suite.test_register_page_elements_and_validation,
    },

    # Category 2: Authentication & Session Management
    {
        "name": "Login Role Preset Selector Auto-Fill",
        "category": "Authentication",
        "description": "Tests clicking role selector pills (Caregiver, Donor, Volunteer, Student) to verify dynamic field population.",
        "func": test_suite.test_login_role_pills_auto_fill,
    },
    {
        "name": "Administrator Authentication",
        "category": "Authentication",
        "description": "Authenticates as System Administrator and validates landing on /admin-dashboard.",
        "func": test_suite.test_admin_login_success,
    },
    {
        "name": "Caregiver / Staff Authentication",
        "category": "Authentication",
        "description": "Authenticates with Caregiver credentials and verifies redirection to /staff-dashboard.",
        "func": test_suite.test_staff_login_success,
    },
    {
        "name": "Donor / Sponsor Authentication",
        "category": "Authentication",
        "description": "Authenticates as Donor and validates access to /donor-dashboard.",
        "func": test_suite.test_donor_login_success,
    },
    {
        "name": "Volunteer Authentication",
        "category": "Authentication",
        "description": "Authenticates as Volunteer and verifies routing to Volunteer portal.",
        "func": test_suite.test_volunteer_login_success,
    },
    {
        "name": "Student / Child Authentication",
        "category": "Authentication",
        "description": "Authenticates as Child/Student and validates access to the student dashboard.",
        "func": test_suite.test_child_student_login_success,
    },
    {
        "name": "Invalid Credentials Rejection & Error Display",
        "category": "Authentication",
        "description": "Submits invalid password and verifies presentation of authentication error banner.",
        "func": test_suite.test_invalid_credentials_error_display,
    },
    {
        "name": "User Session Logout & Cache Clearance",
        "category": "Authentication",
        "description": "Executes logout from the dashboard sidebar and verifies session termination and redirect to /login.",
        "func": test_suite.test_user_logout_flow,
    },

    # Category 3: Security & Role-Based Access Control (RBAC)
    {
        "name": "Protected Route Guard (Unauthenticated Access)",
        "category": "Security & RBAC",
        "description": "Attempts direct navigation to /admin-dashboard when logged out; verifies automatic bounce to /login.",
        "func": test_suite.test_unauthenticated_protected_route,
    },
    {
        "name": "Role Privilege Restriction (Child Access Guard)",
        "category": "Security & RBAC",
        "description": "Authenticates as student and attempts access to /expense-management; verifies privilege containment.",
        "func": test_suite.test_child_rbac_restrictions,
    },

    # Category 4: Admin Core Management Modules
    {
        "name": "Admin Dashboard Metrics & Chart Visualizations",
        "category": "Management Modules",
        "description": "Verifies key performance metric cards (Children, Staff, Volunteers, Donations) and Chart.js canvases.",
        "func": test_suite.test_admin_dashboard_metrics_and_charts,
    },
    {
        "name": "Child Profiles Directory & Real-time Search",
        "category": "Management Modules",
        "description": "Verifies child records table loading, avatar cards, and instant filtering via search input.",
        "func": test_suite.test_child_profiles_management,
    },
    {
        "name": "Donor Management & Directory Module",
        "category": "Management Modules",
        "description": "Validates Donor directory listing, statistics cards, and contribution tracking interface.",
        "func": test_suite.test_donor_management_module,
    },
    {
        "name": "Volunteer Management & Task Assignment Module",
        "category": "Management Modules",
        "description": "Verifies Volunteer directory, availability status, and assignment tools.",
        "func": test_suite.test_volunteer_management_module,
    },
    {
        "name": "Expense Ledger & Financial Module",
        "category": "Management Modules",
        "description": "Verifies expense tracking ledger, category tags, and financial totals.",
        "func": test_suite.test_expense_management_module,
    },
    {
        "name": "Analytics & Operational Reports Module",
        "category": "Management Modules",
        "description": "Verifies system reports, aggregated statistics, and data visualization exports.",
        "func": test_suite.test_reports_analytics_module,
    },
    {
        "name": "System Configuration & Settings Module",
        "category": "Management Modules",
        "description": "Verifies application settings interface and security preferences.",
        "func": test_suite.test_settings_module,
    },

    # Category 5: Intelligence & Records Modules
    {
        "name": "AI Prediction Engine Model Switching",
        "category": "Intelligence & ML",
        "description": "Navigates to AI Prediction Hub and tests tab switching across Academic, Health, Behavior, and Growth models.",
        "func": test_suite.test_ai_prediction_tabs_navigation,
    },
    {
        "name": "Live ML Model Inference & Results Card",
        "category": "Intelligence & ML",
        "description": "Runs Academic Trajectory Random Forest model with input features and asserts predicted outcome display.",
        "func": test_suite.test_ai_prediction_academic_run,
    },
    {
        "name": "Health Records & Vitals Management",
        "category": "Intelligence & ML",
        "description": "Verifies health records ledger, BMI tracking, and medical history cards.",
        "func": test_suite.test_health_management_module,
    },
    {
        "name": "Academic Progression & Examination Records",
        "category": "Intelligence & ML",
        "description": "Verifies academic performance history, subject grades, and marks tracking.",
        "func": test_suite.test_academic_management_module,
    },
]


def run_all():
    is_live = "--live" in sys.argv or "--headed" in sys.argv
    if is_live:
        headless = False
    elif "--headless" in sys.argv:
        headless = True
    else:
        env_val = os.environ.get("HEADLESS", os.environ.get("SELENIUM_HEADLESS", "true")).lower()
        headless = env_val not in ("false", "0", "no", "headed", "live")

    mode_label = "LIVE BROWSER (Watching on screen)" if not headless else "HEADLESS (Background)"

    print("=" * 70)
    print("  HOPENEST ORPHANAGE MANAGEMENT SYSTEM - SELENIUM TEST AUTOMATION")
    print("=" * 70)
    print(f"Target URL: {BASE_URL}")
    print(f"Mode:       {mode_label}")
    print(f"Total Test Scenarios: {len(TEST_REGISTRY)}")
    print("-" * 70)

    driver = get_chrome_driver(headless=headless)
    results = []
    total_start = time.time()

    try:
        for idx, item in enumerate(TEST_REGISTRY, start=1):
            test_name = item["name"]
            category = item["category"]
            func = item["func"]
            desc = item["description"]

            print(f"\n[{idx}/{len(TEST_REGISTRY)}] Running: {test_name} ({category})...")
            ctx = test_suite.TestContext(driver, f"test_{idx:02d}_{func.__name__}")
            start_time = time.time()
            status = "PASS"
            err_msg = None

            try:
                func(driver, ctx)
                # If test completed without screenshot, take one now
                if not ctx.screenshot_path:
                    ctx.capture_screenshot("final")
            except Exception as e:
                status = "FAIL"
                err_msg = traceback.format_exc()
                ctx.log(f"Test failed: {e}")
                ctx.capture_screenshot("failure")
                print(f"  ❌ FAILED: {e}")
            else:
                print(f"  ✅ PASSED ({time.time() - start_time:.2f}s)")

            duration = time.time() - start_time
            results.append({
                "name": test_name,
                "category": category,
                "description": desc,
                "status": status,
                "duration": duration,
                "logs": ctx.logs,
                "screenshot": ctx.screenshot_path,
                "error": err_msg,
            })

    finally:
        driver.quit()

    total_duration = time.time() - total_start
    passed_count = sum(1 for r in results if r["status"] == "PASS")
    failed_count = sum(1 for r in results if r["status"] == "FAIL")

    summary = {
        "total": len(results),
        "passed": passed_count,
        "failed": failed_count,
        "skipped": 0,
        "duration": total_duration,
        "base_url": BASE_URL,
    }

    # Generate Reports
    reports_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "reports"))
    html_report_path = os.path.join(reports_dir, "test_report.html")
    md_report_path = os.path.join(reports_dir, "TEST_REPORT.md")

    generate_html_report(summary, results, html_report_path)
    generate_markdown_report(summary, results, md_report_path)

    print("\n" + "=" * 70)
    print("  TEST EXECUTION SUMMARY")
    print("=" * 70)
    print(f"Total Tests : {len(results)}")
    print(f"Passed      : {passed_count}")
    print(f"Failed      : {failed_count}")
    print(f"Pass Rate   : {round(passed_count / len(results) * 100, 1)}%")
    print(f"Duration    : {total_duration:.2f}s")
    print(f"\nHTML Report : {html_report_path}")
    print(f"Markdown    : {md_report_path}")
    print("=" * 70)

    # Automatically open test report in default browser
    try:
        import webbrowser
        print("\n[+] Automatically opening test report in browser...")
        webbrowser.open(os.path.abspath(html_report_path))
    except Exception as e:
        print(f"Could not open browser automatically: {e}")

    return 0 if failed_count == 0 else 1


if __name__ == "__main__":
    sys.exit(run_all())
