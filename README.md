# Orphanage Management System 🏫🏢

A comprehensive, full-stack web application for managing orphanages, children's profiles, academic records, health checkups, donor management, financial expense tracking, volunteer task allocation, and AI-driven performance prediction.

---

## 🚀 System Architecture

- **Backend**: Python 3.x / Django 5.x REST API with SQLite database (`backend/`)
- **Frontend**: React 19 / Vite / Tailwind CSS / Lucide React (`frontend-react/`)
- **AI/ML Engine**: Scikit-Learn predictive modeling engine for academic & behavioral tracking (`backend/api/ml_engine.py`)

---

## 📂 Project Structure

```
orphanage_manage/
├── backend/                  # Django REST API Backend
│   ├── api/                  # Django App (Models, Views, Serializers, ML Engine)
│   │   ├── models.py         # DB Models (Child, Donor, Expense, Health, Education, etc.)
│   │   ├── views.py          # API ViewSets & Authentication Handlers
│   │   ├── serializers.py    # Django REST Framework Serializers
│   │   ├── ml_engine.py      # ML Engine for performance predictions
│   │   └── urls.py           # API Route Definitions
│   ├── backend/              # Core Django Settings & Configuration
│   ├── manage.py             # Django Command Line Utility
│   └── seed_*.py             # Database Seeding Scripts
├── frontend-react/           # React + Vite Frontend App
│   ├── src/
│   │   ├── components/       # Reusable UI Components (Navbar, Sidebar, Modals)
│   │   ├── pages/            # Role Dashboards (Admin, Staff, Donor, Volunteer, Child)
│   │   ├── App.jsx           # Main React App & Router Setup
│   │   └── index.css         # Styling & Tailwind Utility Imports
│   ├── package.json          # Node Dependencies & Scripts
│   └── vite.config.js        # Vite Build Configuration
├── start.ps1                 # PowerShell script to launch both servers
└── README.md                 # Project Documentation
```

---

## 🛠️ Quick Start & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PowerShell (on Windows)

### 1. Launching Both Servers

You can start both the Django backend and React frontend with a single command:

```powershell
.\start.ps1
```

- **Frontend Application**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:8000/api/`
- **Django Admin Interface**: `http://localhost:8000/admin/`

---

## 🔐 User Roles & Portals

1. **Admin Portal**: Full access to children records, staff management, donor transactions, expense analytics, volunteer allocation, and AI predictions.
2. **Staff Portal**: Update child health logs, academic progress, daily attendance, and general activities.
3. **Donor Portal**: Online donations, sponsorship history, impact tracking, and receipt generation.
4. **Volunteer Portal**: View assigned events, log completed hours, submit feedback, and manage availability.
5. **Child Portal**: Personalized dashboard displaying academic marks, achievements, health status, and upcoming activities.

---

## 🌿 Git Branch Structure

This repository follows a structured branch workflow:

| Branch Name | Purpose |
|---|---|
| `main` | Production-ready stable codebase |
| `master` | Primary mirror branch |
| `dev` | Active development and integration |
| `staging` | Pre-production testing environment |
| `backend` | Dedicated Django API backend code |
| `frontend` | Dedicated React Vite frontend code |

---

## 📄 License & Attribution

Developed for Orphanage Management and Social Welfare Operations. All rights reserved.
