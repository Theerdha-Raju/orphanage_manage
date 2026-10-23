#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

cd backend
echo "--- Installing Python dependencies ---"
pip install -r requirements.txt

echo "--- Collecting static files ---"
python manage.py collectstatic --no-input

echo "--- Running database migrations ---"
python manage.py migrate

echo "--- Seeding default portal user accounts ---"
python seed_portal_users.py || true

echo "--- Seeding real database records (children, donations, expenses, volunteers) ---"
python seed_real_data.py || true
python seed_real_volunteer_tasks.py || true
python seed_eleanor_vance_donations.py || true
python seed_to_500_children.py || true

echo "--- Build complete! ---"
