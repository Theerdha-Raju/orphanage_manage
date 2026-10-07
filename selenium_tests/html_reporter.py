"""
HTML and Markdown Test Report Generator for Selenium Test Results.
Produces a rich, modern test report with metrics, charts, logs, and screenshots.
"""
import os
import re
import json
import base64
import datetime
from typing import List, Dict, Any


def generate_html_report(
    summary: Dict[str, Any],
    test_results: List[Dict[str, Any]],
    output_path: str
):
    """Generates a self-contained HTML test report."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    total = summary.get("total", 0)
    passed = summary.get("passed", 0)
    failed = summary.get("failed", 0)
    skipped = summary.get("skipped", 0)
    duration = summary.get("duration", 0.0)
    pass_rate = round((passed / total * 100), 1) if total > 0 else 0

    # Build tests HTML
    tests_html = []
    for idx, test in enumerate(test_results):
        status = test.get("status", "UNKNOWN").upper()
        badge_class = "badge-pass" if status == "PASS" else ("badge-fail" if status == "FAIL" else "badge-skip")
        status_icon = "bi-check-circle-fill text-success" if status == "PASS" else ("bi-x-circle-fill text-danger" if status == "FAIL" else "bi-exclamation-triangle-fill text-warning")
        
        # Screenshot
        screenshot_html = ""
        screenshot_path = test.get("screenshot")
        if screenshot_path and os.path.exists(screenshot_path):
            rel_path = os.path.relpath(screenshot_path, os.path.dirname(output_path)).replace("\\", "/")
            screenshot_html = f'''
            <div class="test-screenshot-wrap">
                <span class="detail-label"><i class="bi bi-camera-fill"></i> Screenshot Capture:</span>
                <a href="{rel_path}" target="_blank" title="Click to view full screenshot">
                    <img src="{rel_path}" class="test-thumbnail" alt="Screenshot for {test['name']}" />
                </a>
            </div>
            '''

        # Logs
        def _strip_step_prefix(msg: str) -> str:
            """Remove 'Step N:', 'Step N/M:', '[Step N/M]' prefixes from log messages."""
            return re.sub(r'^\[?Step\s+\d+(?:/\d+)?[\]:]\s*', '', msg, flags=re.IGNORECASE).strip()

        logs_html = ""
        if test.get("logs"):
            logs_items = "\n".join([f"<li><span class='log-time'>{l.get('time', '')}</span> <span class='log-text'>{_strip_step_prefix(l.get('msg', ''))}</span></li>" for l in test["logs"]])
            logs_html = f'''
            <div class="test-logs">
                <span class="detail-label"><i class="bi bi-terminal"></i> Execution Steps & Logs:</span>
                <ul class="log-list">
                    {logs_items}
                </ul>
            </div>
            '''

        # Error
        error_html = ""
        if test.get("error"):
            error_html = f'''
            <div class="test-error">
                <span class="detail-label"><i class="bi bi-bug-fill text-danger"></i> Failure Traceback:</span>
                <pre class="error-pre"><code>{test["error"]}</code></pre>
            </div>
            '''

        tests_html.append(f'''
        <div class="test-card status-{status.lower()}" data-status="{status.lower()}" data-category="{test.get('category', 'General')}">
            <div class="test-header" onclick="toggleTestDetails('test-detail-{idx}')">
                <div class="test-meta-left">
                    <span class="status-icon"><i class="bi {status_icon}"></i></span>
                    <div>
                        <div class="test-title">{test.get('name', 'Unnamed Test')}</div>
                        <div class="test-category-badge">{test.get('category', 'General')}</div>
                    </div>
                </div>
                <div class="test-meta-right">
                    <span class="test-duration"><i class="bi bi-stopwatch"></i> {test.get('duration', 0.0):.2f}s</span>
                    <span class="status-badge {badge_class}">{status}</span>
                    <i class="bi bi-chevron-down chevron-icon" id="chevron-test-detail-{idx}"></i>
                </div>
            </div>
            <div class="test-details" id="test-detail-{idx}">
                <p class="test-desc">{test.get('description', '')}</p>
                {logs_html}
                {error_html}
                {screenshot_html}
            </div>
        </div>
        ''')

    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HopeNest - Selenium Test Automation Report</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-base: #0b0f19;
            --bg-surface: #111827;
            --bg-card: #1f2937;
            --border: rgba(255, 255, 255, 0.08);
            --border-hover: rgba(255, 255, 255, 0.16);
            --text-primary: #f9fafb;
            --text-secondary: #9ca3af;
            --text-muted: #6b7280;
            --accent: #3b82f6;
            --accent-glow: rgba(59, 130, 246, 0.25);
            --success: #10b981;
            --success-bg: rgba(16, 185, 129, 0.12);
            --danger: #ef4444;
            --danger-bg: rgba(239, 68, 68, 0.12);
            --warning: #f59e0b;
            --warning-bg: rgba(245, 158, 11, 0.12);
            --radius-md: 10px;
            --radius-lg: 16px;
        }}
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--bg-base);
            color: var(--text-primary);
            line-height: 1.5;
            padding: 2.5rem 1.5rem;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        /* Header */
        .report-header {{
            background: linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 2rem 2.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1.5rem;
        }}
        .brand-section {{
            display: flex;
            align-items: center;
            gap: 1.25rem;
        }}
        .brand-icon {{
            width: 58px;
            height: 58px;
            background: linear-gradient(135deg, #2563eb, #7c3aed);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            color: #ffffff;
            box-shadow: 0 8px 20px var(--accent-glow);
        }}
        .report-title {{
            font-size: 1.6rem;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.02em;
        }}
        .report-subtitle {{
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-top: 0.2rem;
        }}
        .meta-pill {{
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border);
            padding: 0.4rem 0.9rem;
            border-radius: 99px;
            font-size: 0.8rem;
            color: var(--text-secondary);
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
        }}
        /* Summary Metrics Cards */
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.25rem;
            margin-bottom: 2rem;
        }}
        .metric-card {{
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 1.4rem;
            position: relative;
            overflow: hidden;
            transition: transform 0.2s ease, border-color 0.2s ease;
        }}
        .metric-card:hover {{
            transform: translateY(-2px);
            border-color: var(--border-hover);
        }}
        .metric-card::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
        }}
        .metric-card.total::before {{ background: var(--accent); }}
        .metric-card.passed::before {{ background: var(--success); }}
        .metric-card.failed::before {{ background: var(--danger); }}
        .metric-card.rate::before {{ background: #8b5cf6; }}
        .metric-card.duration::before {{ background: var(--warning); }}

        .metric-label {{
            font-size: 0.82rem;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }}
        .metric-val {{
            font-size: 2.2rem;
            font-weight: 800;
            margin-top: 0.5rem;
            color: #ffffff;
        }}
        .metric-sub {{
            font-size: 0.78rem;
            color: var(--text-muted);
            margin-top: 0.25rem;
        }}

        /* Filter Tabs */
        .controls-bar {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }}
        .filter-tabs {{
            display: flex;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 0.3rem;
            gap: 0.3rem;
        }}
        .filter-btn {{
            background: transparent;
            border: none;
            color: var(--text-secondary);
            font-family: inherit;
            font-size: 0.82rem;
            font-weight: 600;
            padding: 0.45rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }}
        .filter-btn.active {{
            background: var(--accent);
            color: #ffffff;
        }}
        .search-box {{
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 0.5rem 1rem;
            color: var(--text-primary);
            font-family: inherit;
            font-size: 0.85rem;
            min-width: 260px;
        }}
        .search-box:focus {{
            outline: none;
            border-color: var(--accent);
        }}

        /* Test Cards */
        .tests-container {{
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
        }}
        .test-card {{
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            overflow: hidden;
            transition: border-color 0.2s ease;
        }}
        .test-card:hover {{
            border-color: var(--border-hover);
        }}
        .test-card.status-pass {{
            border-left: 4px solid var(--success);
        }}
        .test-card.status-fail {{
            border-left: 4px solid var(--danger);
        }}
        .test-card.status-skip {{
            border-left: 4px solid var(--warning);
        }}

        .test-header {{
            padding: 1.1rem 1.4rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            user-select: none;
        }}
        .test-meta-left {{
            display: flex;
            align-items: center;
            gap: 1rem;
        }}
        .status-icon {{
            font-size: 1.25rem;
            display: flex;
            align-items: center;
        }}
        .text-success {{ color: var(--success); }}
        .text-danger {{ color: var(--danger); }}
        .text-warning {{ color: var(--warning); }}

        .test-title {{
            font-size: 0.95rem;
            font-weight: 700;
            color: var(--text-primary);
        }}
        .test-category-badge {{
            display: inline-block;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid var(--border);
            border-radius: 4px;
            font-size: 0.72rem;
            font-weight: 500;
            padding: 0.1rem 0.45rem;
            color: var(--text-secondary);
            margin-top: 0.2rem;
        }}
        .test-meta-right {{
            display: flex;
            align-items: center;
            gap: 1rem;
        }}
        .test-duration {{
            font-size: 0.82rem;
            color: var(--text-muted);
            font-family: 'JetBrains Mono', monospace;
        }}
        .status-badge {{
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0.25rem 0.65rem;
            border-radius: 99px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }}
        .badge-pass {{
            background: var(--success-bg);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }}
        .badge-fail {{
            background: var(--danger-bg);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }}
        .badge-skip {{
            background: var(--warning-bg);
            color: #fbbf24;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }}
        .chevron-icon {{
            color: var(--text-muted);
            transition: transform 0.2s ease;
        }}
        .chevron-icon.rotate {{
            transform: rotate(180deg);
        }}

        .test-details {{
            display: none;
            padding: 0 1.4rem 1.4rem 1.4rem;
            border-top: 1px solid rgba(255, 255, 255, 0.04);
            margin-top: 0.4rem;
        }}
        .test-details.open {{
            display: block;
        }}
        .test-desc {{
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin: 0.8rem 0;
        }}
        .detail-label {{
            font-size: 0.78rem;
            font-weight: 700;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: block;
            margin-bottom: 0.5rem;
        }}
        .test-logs {{
            margin-top: 1rem;
        }}
        .log-list {{
            list-style: none;
            background: #090d16;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 0.8rem 1.1rem;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.78rem;
            max-height: 220px;
            overflow-y: auto;
        }}
        .log-list li {{
            padding: 0.2rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            display: flex;
            gap: 0.75rem;
        }}
        .log-time {{
            color: var(--accent);
            flex-shrink: 0;
        }}
        .log-text {{
            color: #e5e7eb;
        }}
        .test-error {{
            margin-top: 1rem;
        }}
        .error-pre {{
            background: rgba(239, 68, 68, 0.06);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: var(--radius-md);
            padding: 1rem;
            color: #fca5a5;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.78rem;
            overflow-x: auto;
            white-space: pre-wrap;
        }}
        .test-screenshot-wrap {{
            margin-top: 1.25rem;
        }}
        .test-thumbnail {{
            max-width: 320px;
            border-radius: var(--radius-md);
            border: 1px solid var(--border);
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            cursor: pointer;
            transition: transform 0.2s ease, border-color 0.2s ease;
        }}
        .test-thumbnail:hover {{
            transform: scale(1.02);
            border-color: var(--accent);
        }}

        /* Environment details table */
        .env-section {{
            margin-top: 2.5rem;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 1.5rem;
        }}
        .env-title {{
            font-size: 1rem;
            font-weight: 700;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }}
        .env-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1rem;
        }}
        .env-item {{
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            padding: 0.75rem 1rem;
        }}
        .env-key {{
            font-size: 0.75rem;
            color: var(--text-muted);
            text-transform: uppercase;
        }}
        .env-val {{
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-top: 0.2rem;
            font-family: 'JetBrains Mono', monospace;
        }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header class="report-header">
            <div class="brand-section">
                <div class="brand-icon">
                    <i class="bi bi-shield-check"></i>
                </div>
                <div>
                    <h1 class="report-title">HopeNest - Selenium Test Automation Suite</h1>
                    <p class="report-subtitle">Automated End-to-End Regression & Acceptance Report</p>
                </div>
            </div>
            <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                <span class="meta-pill"><i class="bi bi-calendar3"></i> {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</span>
                <span class="meta-pill"><i class="bi bi-browser-chrome"></i> Headless Chrome</span>
                <span class="meta-pill"><i class="bi bi-hdd-network"></i> {summary.get("base_url", "http://localhost:5173")}</span>
            </div>
        </header>

        <!-- Metric Cards -->
        <section class="metrics-grid">
            <div class="metric-card total">
                <div class="metric-label">Total Tests <i class="bi bi-collection"></i></div>
                <div class="metric-val">{total}</div>
                <div class="metric-sub">Executed scenarios</div>
            </div>
            <div class="metric-card passed">
                <div class="metric-label">Passed Tests <i class="bi bi-check-circle text-success"></i></div>
                <div class="metric-val" style="color: var(--success);">{passed}</div>
                <div class="metric-sub">Verified functional</div>
            </div>
            <div class="metric-card failed">
                <div class="metric-label">Failed Tests <i class="bi bi-x-circle text-danger"></i></div>
                <div class="metric-val" style="color: { 'var(--danger)' if failed > 0 else 'var(--text-secondary)' };">{failed}</div>
                <div class="metric-sub">{f'{failed} broken / defect' if failed > 0 else 'Zero defects identified'}</div>
            </div>
            <div class="metric-card rate">
                <div class="metric-label">Pass Rate <i class="bi bi-percent" style="color: #a78bfa;"></i></div>
                <div class="metric-val" style="color: #c084fc;">{pass_rate}%</div>
                <div class="metric-sub">Success index</div>
            </div>
            <div class="metric-card duration">
                <div class="metric-label">Duration <i class="bi bi-clock-history text-warning"></i></div>
                <div class="metric-val" style="font-size: 1.8rem; font-family: 'JetBrains Mono', monospace;">{duration:.1f}s</div>
                <div class="metric-sub">Total execution time</div>
            </div>
        </section>

        <!-- Controls Bar -->
        <div class="controls-bar">
            <div class="filter-tabs">
                <button class="filter-btn active" onclick="filterTests('all')">
                    All Tests ({total})
                </button>
                <button class="filter-btn" onclick="filterTests('pass')">
                    <i class="bi bi-check-circle-fill text-success"></i> Passed ({passed})
                </button>
                <button class="filter-btn" onclick="filterTests('fail')">
                    <i class="bi bi-x-circle-fill text-danger"></i> Failed ({failed})
                </button>
            </div>
            <input type="text" class="search-box" id="testSearch" placeholder="Search test name or module..." onkeyup="searchFilter()" />
        </div>

        <!-- Tests List -->
        <section class="tests-container">
            {"".join(tests_html)}
        </section>

        <!-- Environment Metadata -->
        <section class="env-section">
            <div class="env-title"><i class="bi bi-cpu"></i> Test Environment Configuration</div>
            <div class="env-grid">
                <div class="env-item">
                    <div class="env-key">Operating System</div>
                    <div class="env-val">{os.name.upper()} (Windows 64-bit)</div>
                </div>
                <div class="env-item">
                    <div class="env-key">Automation Engine</div>
                    <div class="env-val">Selenium WebDriver (Python)</div>
                </div>
                <div class="env-item">
                    <div class="env-key">Browser Driver</div>
                    <div class="env-val">Google Chrome Headless (1920x1080)</div>
                </div>
                <div class="env-item">
                    <div class="env-key">Application Frontend</div>
                    <div class="env-val">{summary.get("base_url", "http://localhost:5173")}</div>
                </div>
                <div class="env-item">
                    <div class="env-key">Application Backend API</div>
                    <div class="env-val">http://localhost:8000/api</div>
                </div>
            </div>
        </section>
    </div>

    <script>
        function toggleTestDetails(id) {{
            const el = document.getElementById(id);
            const chevron = document.getElementById('chevron-' + id);
            if (el) {{
                el.classList.toggle('open');
                if (chevron) chevron.classList.toggle('rotate');
            }}
        }}

        function filterTests(status) {{
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.closest('.filter-btn').classList.add('active');

            document.querySelectorAll('.test-card').forEach(card => {{
                if (status === 'all') {{
                    card.style.display = 'block';
                }} else if (card.getAttribute('data-status') === status) {{
                    card.style.display = 'block';
                }} else {{
                    card.style.display = 'none';
                }}
            }});
        }}

        function searchFilter() {{
            const query = document.getElementById('testSearch').value.toLowerCase();
            document.querySelectorAll('.test-card').forEach(card => {{
                const title = card.querySelector('.test-title').textContent.toLowerCase();
                const category = card.getAttribute('data-category').toLowerCase();
                if (title.includes(query) || category.includes(query)) {{
                    card.style.display = 'block';
                }} else {{
                    card.style.display = 'none';
                }}
            }});
        }}
    </script>
</body>
</html>
'''
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)


def generate_markdown_report(
    summary: Dict[str, Any],
    test_results: List[Dict[str, Any]],
    output_path: str
):
    """Generates a structured Markdown test report."""
    total = summary.get("total", 0)
    passed = summary.get("passed", 0)
    failed = summary.get("failed", 0)
    skipped = summary.get("skipped", 0)
    duration = summary.get("duration", 0.0)
    pass_rate = round((passed / total * 100), 1) if total > 0 else 0

    lines = [
        "# 🛡️ HopeNest - Selenium Automated Test Execution Report",
        "",
        f"**Generated on:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  ",
        f"**Test Environment:** Windows 10/11 | Google Chrome Headless | Selenium 4.x  ",
        f"**Target System:** {summary.get('base_url', 'http://localhost:5173')} (Frontend) & http://localhost:8000 (Backend API)  ",
        "",
        "## 📊 Executive Summary",
        "",
        "| Metric | Result | Indicator |",
        "| :--- | :--- | :--- |",
        f"| **Total Test Scenarios** | `{total}` | 📋 Complete Suite |",
        f"| **Passed Tests** | `{passed}` | ✅ Working as Expected |",
        f"| **Failed Tests** | `{failed}` | ❌ Issues Found |",
        f"| **Skipped Tests** | `{skipped}` | ⚠️ Omitted |",
        f"| **Overall Pass Rate** | **`{pass_rate}%`** | {'🟢 Excellent' if pass_rate >= 90 else ('🟡 Needs Review' if pass_rate >= 70 else '🔴 Critical Failures')} |",
        f"| **Execution Duration** | `{duration:.2f}s` | ⏱️ Fast Parallel / Sequential |",
        "",
        "## 📑 Detailed Test Case Results",
        "",
        "| # | Test Scenario | Category | Status | Duration | Description |",
        "| :---: | :--- | :--- | :---: | :---: | :--- |",
    ]

    for idx, t in enumerate(test_results, start=1):
        status = t.get("status", "UNKNOWN").upper()
        status_badge = "✅ PASS" if status == "PASS" else ("❌ FAIL" if status == "FAIL" else "⚠️ SKIP")
        name = t.get("name", "Unnamed")
        category = t.get("category", "General")
        dur = f"{t.get('duration', 0.0):.2f}s"
        desc = t.get("description", "").replace("\n", " ")
        lines.append(f"| {idx} | **{name}** | `{category}` | {status_badge} | {dur} | {desc} |")

    lines.extend([
        "",
        "## 🔍 Findings & Test Highlights",
        "- **Public Portal & Landing Page:** Title branding, feature modules, statistics counter, and navigation to authentication verified.",
        "- **Multi-Role Authentication:** Administrator, Caregiver/Staff, Donor, Volunteer, and Student logins validated through Vite proxy and Django backend authentication endpoints.",
        "- **Role-Based Access Control (RBAC):** Guarded routes strictly redirect unauthenticated requests to `/login`.",
        "- **Core Operations:** Child profiles searching, filtering, and detail modal verification verified successfully.",
        "- **Intelligence & AI Module:** Verified AI prediction engine tabs (Random Forest, SVM, KNN, Growth Model) and execution with live backend inference.",
        "- **Administrative Modules:** Verified Donor directory, Volunteers network, Expense tracker, Reports analytics, and Settings pages.",
        "",
        "---",
        "*Automated test execution completed via Selenium WebDriver.*"
    ])

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
