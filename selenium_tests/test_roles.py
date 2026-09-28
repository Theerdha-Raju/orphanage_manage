"""
Targeted Selenium Test Runner for:
- Login Page (Pills, Form Input, Error handling)
- Administrator Role & Dashboard
- Caregiver / Staff Role & Dashboard
- Donor Role & Dashboard
- Volunteer Role & Dashboard
"""
import sys
import os
import time
import argparse

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


ROLE_TESTS = [
    # 1. Login Page
    {
        "name": "1. Login Page - Role Preset Auto-Fill",
        "func": test_suite.test_login_role_pills_auto_fill,
        "desc": "Verifies clicking role pills (Caregiver, Donor, Volunteer, Student) automatically populates credentials.",
    },
    {
        "name": "2. Login Page - Invalid Credentials Rejection",
        "func": test_suite.test_invalid_credentials_error_display,
        "desc": "Verifies entering bad credentials correctly shows an authentication error banner.",
    },

    # 2. Administrator
    {
        "name": "3. Administrator - Login & Dashboard Access",
        "func": test_suite.test_admin_login_success,
        "desc": "Logs in with admin@orphanage.com and verifies redirection to /admin-dashboard.",
    },
    {
        "name": "4. Administrator - Dashboard Metrics & Charts",
        "func": test_suite.test_admin_dashboard_metrics_and_charts,
        "desc": "Verifies admin KPI stat cards and interactive Chart.js visualizations load.",
    },

    # 3. Caregiver
    {
        "name": "5. Caregiver - Login & Caregiver Dashboard Access",
        "func": test_suite.test_staff_login_success,
        "desc": "Logs in with staff@orphanage.com (Caregiver) and verifies redirection to /staff-dashboard.",
    },

    # 4. Donor
    {
        "name": "6. Donor - Login & Donor Dashboard Access",
        "func": test_suite.test_donor_login_success,
        "desc": "Logs in with donor@orphanage.com and verifies redirection to /donor-dashboard.",
    },

    # 5. Volunteer
    {
        "name": "7. Volunteer - Login & Volunteer Dashboard Access",
        "func": test_suite.test_volunteer_login_success,
        "desc": "Logs in with volunteer@orphanage.com and verifies redirection to /volunteer-dashboard.",
    },

    # 6. Session Logout
    {
        "name": "8. Session Management - User Logout Flow",
        "func": test_suite.test_user_logout_flow,
        "desc": "Verifies logging out clears tokens and returns user safely to /login.",
    },
]


from selenium_tests.html_reporter import generate_html_report, generate_markdown_report


def run_role_tests(headless: bool = True, auto_open: bool = True):
    print("=" * 70)
    print("  HOPENEST SELENIUM TESTS: LOGIN & ROLE PORTALS")
    print(f"  Target: {BASE_URL} | Mode: {'Headless' if headless else 'Headed (Visible Browser)'}")
    print("=" * 70)

    driver = get_chrome_driver(headless=headless)
    passed = 0
    failed = 0
    results = []
    total_start = time.time()

    try:
        for idx, t in enumerate(ROLE_TESTS, start=1):
            test_name = t["name"]
            desc = t["desc"]
            print(f"\n[{idx}/{len(ROLE_TESTS)}] Testing: {test_name}")
            print(f"    Description: {desc}")
            ctx = test_suite.TestContext(driver, f"role_test_{idx:02d}")
            t_start = time.time()
            status = "PASS"
            err_msg = None

            try:
                t["func"](driver, ctx)
                if not ctx.screenshot_path:
                    ctx.capture_screenshot("final")
                passed += 1
                print(f"    Status: [PASS] PASSED ({time.time() - t_start:.2f}s)")
            except Exception as e:
                status = "FAIL"
                err_msg = str(e)
                failed += 1
                ctx.capture_screenshot("failure")
                print(f"    Status: [FAIL] FAILED - {e}")

            results.append({
                "name": test_name,
                "category": "Authentication & Roles",
                "description": desc,
                "status": status,
                "duration": time.time() - t_start,
                "logs": ctx.logs,
                "screenshot": ctx.screenshot_path,
                "error": err_msg,
            })

    finally:
        driver.quit()

    total_duration = time.time() - total_start
    summary = {
        "total": len(results),
        "passed": passed,
        "failed": failed,
        "skipped": 0,
        "duration": total_duration,
        "base_url": BASE_URL,
    }

    reports_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "reports"))
    html_report_path = os.path.join(reports_dir, "test_report.html")
    md_report_path = os.path.join(reports_dir, "TEST_REPORT.md")

    generate_html_report(summary, results, html_report_path)
    generate_markdown_report(summary, results, md_report_path)

    print("\n" + "=" * 70)
    print("  TEST SUMMARY")
    print("=" * 70)
    print(f"  Total      : {len(results)}")
    print(f"  Passed     : {passed}")
    print(f"  Failed     : {failed}")
    print(f"  Pass Rate  : {round(passed / len(results) * 100, 1)}%")
    print(f"  Duration   : {total_duration:.2f}s")
    print(f"  HTML Report: {html_report_path}")
    print(f"  Screenshots: {os.path.join(reports_dir, 'screenshots')}")
    print("=" * 70)

    if auto_open:
        try:
            import webbrowser
            print("\n[+] Automatically opening test report in browser...")
            webbrowser.open(os.path.abspath(html_report_path))
        except Exception as e:
            print(f"Could not open browser automatically: {e}")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Login & Role Selenium Tests")
    parser.add_argument(
        "--headed",
        "--visible",
        action="store_true",
        help="Run tests with a visible Chrome browser window",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not automatically open the HTML report in the browser when finished",
    )
    parser.add_argument(
        "--open-report",
        action="store_true",
        help="Open existing HTML test report in browser immediately without re-running tests",
    )
    args = parser.parse_args()

    if args.open_report:
        import webbrowser
        report_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "reports", "test_report.html")
        )
        print(f"Opening: {report_path}")
        webbrowser.open(report_path)
        sys.exit(0)

    sys.exit(run_role_tests(headless=not args.headed, auto_open=not args.no_browser))
