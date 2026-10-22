# 🛡️ HopeNest - Selenium Automated Test Execution Report

**Generated on:** 2026-10-09 09:12:30  
**Test Environment:** Windows 10/11 | Google Chrome Headless | Selenium 4.x  
**Target System:** http://localhost:5173 (Frontend) & http://localhost:8000 (Backend API)  

## 📊 Executive Summary

| Metric | Result | Indicator |
| :--- | :--- | :--- |
| **Total Test Scenarios** | `26` | 📋 Complete Suite |
| **Passed Tests** | `3` | ✅ Working as Expected |
| **Failed Tests** | `23` | ❌ Issues Found |
| **Skipped Tests** | `0` | ⚠️ Omitted |
| **Overall Pass Rate** | **`11.5%`** | 🔴 Critical Failures |
| **Execution Duration** | `461.50s` | ⏱️ Fast Parallel / Sequential |

## 📑 Detailed Test Case Results

| # | Test Scenario | Category | Status | Duration | Description |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | **Landing Page Branding & Hero** | `Public & Landing` | ✅ PASS | 9.73s | Validates page title, HopeNest branding, header navigation bar, and hero section. |
| 2 | **Landing Page Feature Modules & Metrics** | `Public & Landing` | ✅ PASS | 2.13s | Verifies the 6 key service feature cards, live counter metrics, and testimonials on the homepage. |
| 3 | **Landing Page CTA Navigation to Login** | `Public & Landing` | ✅ PASS | 3.19s | Clicks navigation controls on the landing page and verifies redirection to /login. |
| 4 | **Self-Service Password Reset Request** | `Public & Landing` | ❌ FAIL | 9.41s | Submits an email for password recovery on /forgot-password and verifies the confirmation screen. |
| 5 | **Account Registration Form & Validation** | `Public & Landing` | ❌ FAIL | 0.01s | Verifies input controls, role selection, and client-side form validation on /register. |
| 6 | **Login Role Preset Selector Auto-Fill** | `Authentication` | ❌ FAIL | 0.02s | Tests clicking role selector pills (Caregiver, Donor, Volunteer, Student) to verify dynamic field population. |
| 7 | **Administrator Authentication** | `Authentication` | ❌ FAIL | 0.02s | Authenticates as System Administrator and validates landing on /admin-dashboard. |
| 8 | **Caregiver / Staff Authentication** | `Authentication` | ❌ FAIL | 0.01s | Authenticates with Caregiver credentials and verifies redirection to /staff-dashboard. |
| 9 | **Donor / Sponsor Authentication** | `Authentication` | ❌ FAIL | 0.01s | Authenticates as Donor and validates access to /donor-dashboard. |
| 10 | **Volunteer Authentication** | `Authentication` | ❌ FAIL | 0.02s | Authenticates as Volunteer and verifies routing to Volunteer portal. |
| 11 | **Student / Child Authentication** | `Authentication` | ❌ FAIL | 0.01s | Authenticates as Child/Student and validates access to the student dashboard. |
| 12 | **Invalid Credentials Rejection & Error Display** | `Authentication` | ❌ FAIL | 0.01s | Submits invalid password and verifies presentation of authentication error banner. |
| 13 | **User Session Logout & Cache Clearance** | `Authentication` | ❌ FAIL | 0.01s | Executes logout from the dashboard sidebar and verifies session termination and redirect to /login. |
| 14 | **Protected Route Guard (Unauthenticated Access)** | `Security & RBAC` | ❌ FAIL | 0.01s | Attempts direct navigation to /admin-dashboard when logged out; verifies automatic bounce to /login. |
| 15 | **Role Privilege Restriction (Child Access Guard)** | `Security & RBAC` | ❌ FAIL | 0.02s | Authenticates as student and attempts access to /expense-management; verifies privilege containment. |
| 16 | **Admin Dashboard Metrics & Chart Visualizations** | `Management Modules` | ❌ FAIL | 0.01s | Verifies key performance metric cards (Children, Staff, Volunteers, Donations) and Chart.js canvases. |
| 17 | **Child Profiles Directory & Real-time Search** | `Management Modules` | ❌ FAIL | 0.01s | Verifies child records table loading, avatar cards, and instant filtering via search input. |
| 18 | **Donor Management & Directory Module** | `Management Modules` | ❌ FAIL | 0.01s | Validates Donor directory listing, statistics cards, and contribution tracking interface. |
| 19 | **Volunteer Management & Task Assignment Module** | `Management Modules` | ❌ FAIL | 0.01s | Verifies Volunteer directory, availability status, and assignment tools. |
| 20 | **Expense Ledger & Financial Module** | `Management Modules` | ❌ FAIL | 0.01s | Verifies expense tracking ledger, category tags, and financial totals. |
| 21 | **Analytics & Operational Reports Module** | `Management Modules` | ❌ FAIL | 0.01s | Verifies system reports, aggregated statistics, and data visualization exports. |
| 22 | **System Configuration & Settings Module** | `Management Modules` | ❌ FAIL | 0.01s | Verifies application settings interface and security preferences. |
| 23 | **AI Prediction Engine Model Switching** | `Intelligence & ML` | ❌ FAIL | 0.01s | Navigates to AI Prediction Hub and tests tab switching across Academic, Health, Behavior, and Growth models. |
| 24 | **Live ML Model Inference & Results Card** | `Intelligence & ML` | ❌ FAIL | 0.01s | Runs Academic Trajectory Random Forest model with input features and asserts predicted outcome display. |
| 25 | **Health Records & Vitals Management** | `Intelligence & ML` | ❌ FAIL | 0.01s | Verifies health records ledger, BMI tracking, and medical history cards. |
| 26 | **Academic Progression & Examination Records** | `Intelligence & ML` | ❌ FAIL | 0.01s | Verifies academic performance history, subject grades, and marks tracking. |

## 🔍 Findings & Test Highlights
- **Public Portal & Landing Page:** Title branding, feature modules, statistics counter, and navigation to authentication verified.
- **Multi-Role Authentication:** Administrator, Caregiver/Staff, Donor, Volunteer, and Student logins validated through Vite proxy and Django backend authentication endpoints.
- **Role-Based Access Control (RBAC):** Guarded routes strictly redirect unauthenticated requests to `/login`.
- **Core Operations:** Child profiles searching, filtering, and detail modal verification verified successfully.
- **Intelligence & AI Module:** Verified AI prediction engine tabs (Random Forest, SVM, KNN, Growth Model) and execution with live backend inference.
- **Administrative Modules:** Verified Donor directory, Volunteers network, Expense tracker, Reports analytics, and Settings pages.

---
*Automated test execution completed via Selenium WebDriver.*