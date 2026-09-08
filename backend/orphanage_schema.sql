-- ============================================================
--  INTELLIGENT CHILD DEVELOPMENT & ORPHANAGE MANAGEMENT SYSTEM
--  PostgreSQL Production Database Schema
--  MCA Mini Project | Django REST Framework + React.js
-- ============================================================

-- ============================================================
-- SECTION 1: CREATE ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'admin', 'staff', 'doctor', 'teacher', 'volunteer', 'donor'
);

CREATE TYPE gender_type AS ENUM (
    'Male', 'Female', 'Other'
);

CREATE TYPE login_status AS ENUM (
    'Active', 'Inactive', 'Blocked'
);

CREATE TYPE child_status AS ENUM (
    'Active', 'Adopted', 'Transferred', 'Deceased'
);

CREATE TYPE donor_status AS ENUM (
    'Active', 'Inactive'
);

CREATE TYPE volunteer_status AS ENUM (
    'Active', 'Inactive', 'Suspended'
);

CREATE TYPE donation_type AS ENUM (
    'Cash', 'Food', 'Clothing', 'Education', 'Medical', 'Infrastructure', 'Other'
);

CREATE TYPE donation_status AS ENUM (
    'Received', 'Pending', 'Cancelled'
);

CREATE TYPE attendance_status AS ENUM (
    'Present', 'Absent', 'Leave', 'Holiday'
);

CREATE TYPE health_status AS ENUM (
    'Healthy', 'Under Treatment', 'Critical', 'Recovered'
);

CREATE TYPE alert_type_enum AS ENUM (
    'Health', 'Behavior', 'Academic', 'Safety', 'General'
);

CREATE TYPE alert_status AS ENUM (
    'Open', 'Acknowledged', 'Resolved'
);

CREATE TYPE assignment_status AS ENUM (
    'Assigned', 'Completed', 'Cancelled'
);

-- ============================================================
-- SECTION 2: CREATE TABLES
-- ============================================================

-- ------------------------------------------------------------
-- TABLE 1: users
-- ------------------------------------------------------------
CREATE TABLE users (
    user_id         SERIAL          PRIMARY KEY,
    full_name       VARCHAR(100)    NOT NULL,
    phone_number    VARCHAR(15)     NOT NULL UNIQUE
                                    CHECK (phone_number ~ '^\+?[0-9]{7,15}$'),
    gender          gender_type     NOT NULL,
    address         VARCHAR(255)    NOT NULL,
    designation     VARCHAR(100)    NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'Active'
                                    CHECK (status IN ('Active', 'Inactive')),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_status       ON users(status);
CREATE INDEX idx_users_designation  ON users(designation);

-- ------------------------------------------------------------
-- TABLE 2: login
-- ------------------------------------------------------------
CREATE TABLE login (
    login_id    SERIAL          PRIMARY KEY,
    email       VARCHAR(150)    NOT NULL UNIQUE
                                CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    password    VARCHAR(255)    NOT NULL,
    role        user_role       NOT NULL DEFAULT 'staff',
    status      login_status    NOT NULL DEFAULT 'Active',
    user_id     INT             NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    last_login  TIMESTAMP,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_login_email    ON login(email);
CREATE INDEX idx_login_role     ON login(role);
CREATE INDEX idx_login_user_id  ON login(user_id);

-- ------------------------------------------------------------
-- TABLE 3: child
-- ------------------------------------------------------------
CREATE TABLE child (
    child_id        SERIAL          PRIMARY KEY,
    full_name       VARCHAR(100)    NOT NULL,
    date_of_birth   DATE            NOT NULL CHECK (date_of_birth <= CURRENT_DATE),
    gender          gender_type     NOT NULL,
    admission_date  DATE            NOT NULL DEFAULT CURRENT_DATE
                                    CHECK (admission_date <= CURRENT_DATE),
    guardian_name   VARCHAR(100),
    blood_group     VARCHAR(5)      CHECK (blood_group IN ('A+','A-','B+','B-','O+','O-','AB+','AB-')),
    photo           VARCHAR(500),
    status          child_status    NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_child_status   ON child(status);
CREATE INDEX idx_child_name     ON child(full_name);
CREATE INDEX idx_child_dob      ON child(date_of_birth);

-- ------------------------------------------------------------
-- TABLE 4: donor
-- ------------------------------------------------------------
CREATE TABLE donor (
    donor_id        SERIAL          PRIMARY KEY,
    full_name       VARCHAR(100)    NOT NULL,
    phone_number    VARCHAR(15)     UNIQUE
                                    CHECK (phone_number ~ '^\+?[0-9]{7,15}$'),
    email           VARCHAR(150)    UNIQUE
                                    CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    address         VARCHAR(255),
    status          donor_status    NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_donor_status   ON donor(status);
CREATE INDEX idx_donor_email    ON donor(email);

-- ------------------------------------------------------------
-- TABLE 5: donation
-- ------------------------------------------------------------
CREATE TABLE donation (
    donation_id         SERIAL          PRIMARY KEY,
    donor_id            INT             NOT NULL REFERENCES donor(donor_id) ON DELETE CASCADE,
    donation_type       donation_type   NOT NULL,
    amount              DECIMAL(12,2)   DEFAULT 0.00
                                        CHECK (amount >= 0),
    item_description    VARCHAR(500),
    donation_date       DATE            NOT NULL DEFAULT CURRENT_DATE,
    status              donation_status NOT NULL DEFAULT 'Received',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_donation_cash_amount
        CHECK (donation_type != 'Cash' OR amount > 0)
);

-- Indexes
CREATE INDEX idx_donation_donor_id      ON donation(donor_id);
CREATE INDEX idx_donation_type          ON donation(donation_type);
CREATE INDEX idx_donation_date          ON donation(donation_date);
CREATE INDEX idx_donation_status        ON donation(status);

-- ------------------------------------------------------------
-- TABLE 6: volunteer
-- ------------------------------------------------------------
CREATE TABLE volunteer (
    volunteer_id    SERIAL              PRIMARY KEY,
    full_name       VARCHAR(100)        NOT NULL,
    phone_number    VARCHAR(15)         UNIQUE
                                        CHECK (phone_number ~ '^\+?[0-9]{7,15}$'),
    email           VARCHAR(150)        UNIQUE
                                        CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    skills          TEXT,
    availability    VARCHAR(100)        NOT NULL DEFAULT 'Weekends',
    status          volunteer_status    NOT NULL DEFAULT 'Active',
    created_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_volunteer_status   ON volunteer(status);
CREATE INDEX idx_volunteer_email    ON volunteer(email);

-- ------------------------------------------------------------
-- TABLE 7: volunteer_assignment
-- ------------------------------------------------------------
CREATE TABLE volunteer_assignment (
    assignment_id   SERIAL              PRIMARY KEY,
    volunteer_id    INT                 NOT NULL REFERENCES volunteer(volunteer_id) ON DELETE CASCADE,
    event_name      VARCHAR(200)        NOT NULL,
    assigned_date   DATE                NOT NULL DEFAULT CURRENT_DATE,
    feedback        TEXT,
    status          assignment_status   NOT NULL DEFAULT 'Assigned',
    created_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_assignment_volunteer_id    ON volunteer_assignment(volunteer_id);
CREATE INDEX idx_assignment_date            ON volunteer_assignment(assigned_date);
CREATE INDEX idx_assignment_status          ON volunteer_assignment(status);

-- ------------------------------------------------------------
-- TABLE 8: attendance
-- ------------------------------------------------------------
CREATE TABLE attendance (
    attendance_id       SERIAL              PRIMARY KEY,
    child_id            INT                 NOT NULL REFERENCES child(child_id) ON DELETE CASCADE,
    attendance_date     DATE                NOT NULL DEFAULT CURRENT_DATE,
    attendance_status   attendance_status   NOT NULL,
    marked_by           INT                 REFERENCES users(user_id) ON DELETE SET NULL,
    created_at          TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (child_id, attendance_date)
);

-- Indexes
CREATE INDEX idx_attendance_child_id    ON attendance(child_id);
CREATE INDEX idx_attendance_date        ON attendance(attendance_date);
CREATE INDEX idx_attendance_status      ON attendance(attendance_status);
CREATE INDEX idx_attendance_marked_by   ON attendance(marked_by);

-- ------------------------------------------------------------
-- TABLE 9: education
-- ------------------------------------------------------------
CREATE TABLE education (
    education_id    SERIAL          PRIMARY KEY,
    child_id        INT             NOT NULL REFERENCES child(child_id) ON DELETE CASCADE,
    class_name      VARCHAR(50)     NOT NULL,
    subject         VARCHAR(100)    NOT NULL,
    marks           DECIMAL(5,2)    NOT NULL
                                    CHECK (marks >= 0 AND marks <= 100),
    exam_date       DATE            NOT NULL,
    remarks         TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_education_child_id     ON education(child_id);
CREATE INDEX idx_education_class        ON education(class_name);
CREATE INDEX idx_education_exam_date    ON education(exam_date);

-- ------------------------------------------------------------
-- TABLE 10: health
-- ------------------------------------------------------------
CREATE TABLE health (
    health_id       SERIAL          PRIMARY KEY,
    child_id        INT             NOT NULL REFERENCES child(child_id) ON DELETE CASCADE,
    height_cm       DECIMAL(5,2)    NOT NULL CHECK (height_cm > 0 AND height_cm < 300),
    weight_kg       DECIMAL(5,2)    NOT NULL CHECK (weight_kg > 0 AND weight_kg < 300),
    checkup_date    DATE            NOT NULL DEFAULT CURRENT_DATE,
    notes           TEXT,
    status          health_status   NOT NULL DEFAULT 'Healthy',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_health_child_id        ON health(child_id);
CREATE INDEX idx_health_checkup_date    ON health(checkup_date);
CREATE INDEX idx_health_status          ON health(status);

-- ------------------------------------------------------------
-- TABLE 11: achievement
-- ------------------------------------------------------------
CREATE TABLE achievement (
    achievement_id      SERIAL          PRIMARY KEY,
    child_id            INT             NOT NULL REFERENCES child(child_id) ON DELETE CASCADE,
    title               VARCHAR(200)    NOT NULL,
    description         TEXT,
    achievement_date    DATE            NOT NULL DEFAULT CURRENT_DATE,
    category            VARCHAR(100)    NOT NULL
                                        CHECK (category IN ('Academic','Sports','Arts','Cultural','Science','Other')),
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_achievement_child_id   ON achievement(child_id);
CREATE INDEX idx_achievement_category   ON achievement(category);
CREATE INDEX idx_achievement_date       ON achievement(achievement_date);

-- ------------------------------------------------------------
-- TABLE 12: alert
-- ------------------------------------------------------------
CREATE TABLE alert (
    alert_id        SERIAL              PRIMARY KEY,
    child_id        INT                 NOT NULL REFERENCES child(child_id) ON DELETE CASCADE,
    alert_type      alert_type_enum     NOT NULL,
    message         TEXT                NOT NULL,
    created_date    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          alert_status        NOT NULL DEFAULT 'Open'
);

-- Indexes
CREATE INDEX idx_alert_child_id     ON alert(child_id);
CREATE INDEX idx_alert_type         ON alert(alert_type);
CREATE INDEX idx_alert_status       ON alert(status);
CREATE INDEX idx_alert_created_date ON alert(created_date);


-- ============================================================
-- SECTION 3: SAMPLE INSERT STATEMENTS (3 records per table)
-- ============================================================

-- TABLE 1: users
INSERT INTO users (full_name, phone_number, gender, address, designation, status) VALUES
    ('Rahul Menon',      '9876543210', 'Male',   '12 MG Road, Kochi, Kerala',         'Admin Manager',    'Active'),
    ('Priya Nair',       '9876543211', 'Female', '45 Park Avenue, Trivandrum, Kerala', 'Staff Coordinator','Active'),
    ('Dr. Arun Kumar',   '9876543212', 'Male',   '78 Hospital Road, Kozhikode, Kerala','Medical Officer',  'Active');

-- TABLE 2: login
INSERT INTO login (email, password, role, status, user_id) VALUES
    ('rahul.menon@orphanage.com',  '$2b$12$hashed_password_here_1', 'admin',   'Active', 1),
    ('priya.nair@orphanage.com',   '$2b$12$hashed_password_here_2', 'staff',   'Active', 2),
    ('arun.kumar@orphanage.com',   '$2b$12$hashed_password_here_3', 'doctor',  'Active', 3);

-- TABLE 3: child
INSERT INTO child (full_name, date_of_birth, gender, admission_date, guardian_name, blood_group, status) VALUES
    ('Arjun Das',   '2012-05-14', 'Male',   '2018-06-01', 'Rajan Das',    'A+', 'Active'),
    ('Anjali Ravi', '2014-09-22', 'Female', '2019-03-15', NULL,           'B+', 'Active'),
    ('Vikram Sasi', '2010-11-08', 'Male',   '2017-01-10', 'Sasi Kumar',   'O+', 'Active');

-- TABLE 4: donor
INSERT INTO donor (full_name, phone_number, email, address, status) VALUES
    ('Suresh Pillai',   '9988776655', 'suresh.pillai@gmail.com',  '23 Lake View, Kochi',      'Active'),
    ('Tech Corp India', '9988776656', 'csr@techcorp.in',          '101 IT Park, Trivandrum',  'Active'),
    ('Meera Krishnan',  '9988776657', 'meera.k@hotmail.com',      '67 Rose Garden, Thrissur', 'Active');

-- TABLE 5: donation
INSERT INTO donation (donor_id, donation_type, amount, item_description, donation_date, status) VALUES
    (1, 'Cash',      5000.00,  NULL,                           '2025-01-15', 'Received'),
    (2, 'Education', 25000.00, '50 school bags and stationery','2025-02-10', 'Received'),
    (3, 'Food',      0.00,     '100kg rice, 20kg dal',         '2025-03-05', 'Received');

-- TABLE 6: volunteer
INSERT INTO volunteer (full_name, phone_number, email, skills, availability, status) VALUES
    ('Dr. Ramesh Nair',  '9871234567', 'ramesh.v@gmail.com',   'Medical, First Aid',       'Weekends',  'Active'),
    ('Sunita Roy',       '9871234568', 'sunita.r@gmail.com',   'Teaching, Arts & Crafts',  'Weekdays',  'Active'),
    ('Arun Mehta',       '9871234569', 'arun.m@yahoo.com',     'Sports Coaching, Yoga',    'Flexible',  'Active');

-- TABLE 7: volunteer_assignment
INSERT INTO volunteer_assignment (volunteer_id, event_name, assigned_date, feedback, status) VALUES
    (1, 'Monthly Health Checkup Camp',  '2025-01-20', 'Excellent participation, 30 children examined.', 'Completed'),
    (2, 'Annual Art & Craft Workshop',  '2025-02-14', 'Kids loved the painting session.',               'Completed'),
    (3, 'Sports Day Coordination',      '2025-03-08', NULL,                                             'Assigned');

-- TABLE 8: attendance
INSERT INTO attendance (child_id, attendance_date, attendance_status, marked_by) VALUES
    (1, '2025-07-28', 'Present', 2),
    (2, '2025-07-28', 'Present', 2),
    (3, '2025-07-28', 'Absent',  2);

-- TABLE 9: education
INSERT INTO education (child_id, class_name, subject, marks, exam_date, remarks) VALUES
    (1, 'Grade 7', 'Mathematics', 88.50, '2025-03-20', 'Excellent performance'),
    (2, 'Grade 5', 'Science',     74.00, '2025-03-21', 'Good, needs improvement in diagrams'),
    (3, 'Grade 9', 'English',     91.00, '2025-03-22', 'Outstanding essay writing skills');

-- TABLE 10: health
INSERT INTO health (child_id, height_cm, weight_kg, checkup_date, notes, status) VALUES
    (1, 142.5, 38.0, '2025-01-20', 'Healthy. Vitamin D supplement recommended.',  'Healthy'),
    (2, 128.0, 29.5, '2025-01-20', 'Mild anaemia detected. Iron tablets given.',  'Under Treatment'),
    (3, 158.0, 52.0, '2025-01-20', 'Good health. Regular diet advised.',           'Healthy');

-- TABLE 11: achievement
INSERT INTO achievement (child_id, title, description, achievement_date, category) VALUES
    (1, 'District Science Olympiad - 1st Place',   'Won first place in district-level science competition.', '2025-02-15', 'Science'),
    (2, 'State Painting Competition - 2nd Place',  'Secured second position in state art competition.',      '2025-03-10', 'Arts'),
    (3, 'School Cricket Team Captain',             'Selected as captain of the school cricket team.',         '2025-04-01', 'Sports');

-- TABLE 12: alert
INSERT INTO alert (child_id, alert_type, message, status) VALUES
    (2, 'Health',    'Anjali has been diagnosed with mild anaemia. Immediate dietary changes required.',     'Acknowledged'),
    (3, 'Behavior',  'Vikram showed aggressive behavior during group study. Counselling session scheduled.', 'Open'),
    (1, 'Academic',  'Arjun missed 3 consecutive classes this week. Attendance follow-up needed.',           'Open');


-- ============================================================
-- SECTION 4: TEXTUAL ER DIAGRAM
-- ============================================================

/*
================================================================================
  ER DIAGRAM — Orphanage Management System (12 Tables)
================================================================================

 ┌─────────────┐         ┌─────────────────────┐
 │    users    │ 1 ───── M│       login         │
 │─────────────│         │─────────────────────│
 │ user_id  PK │         │ login_id         PK │
 │ full_name   │         │ email    (UNIQUE)    │
 │ phone (UNQ) │         │ password            │
 │ gender      │         │ role (ENUM)         │
 │ address     │         │ status (ENUM)       │
 │ designation │         │ user_id          FK │
 │ status      │         └─────────────────────┘
 └──────┬──────┘
        │ 1 (marked_by)
        │
        ▼ M
 ┌──────────────────┐
 │   attendance     │
 │──────────────────│
 │ attendance_id PK │
 │ child_id      FK │◄──────────────────────────────────────────┐
 │ attendance_date  │                                           │
 │ status (ENUM)    │                                           │
 │ marked_by     FK │                                           │
 └──────────────────┘                                           │
                                                                │
 ┌───────────────┐                                              │
 │     donor     │ 1 ─── M ┌──────────────────┐               │
 │───────────────│         │    donation      │               │
 │ donor_id   PK │         │──────────────────│               │
 │ full_name     │         │ donation_id   PK │               │
 │ phone (UNQ)   │         │ donor_id      FK │               │
 │ email (UNQ)   │         │ donation_type    │               │
 │ address       │         │ amount           │               │
 │ status (ENUM) │         │ item_description │               │
 └───────────────┘         │ donation_date    │               │
                           │ status (ENUM)    │               │
                           └──────────────────┘               │
                                                               │
 ┌─────────────────┐                                           │
 │   volunteer     │ 1 ─── M ┌───────────────────────────┐   │
 │─────────────────│         │   volunteer_assignment    │   │
 │ volunteer_id PK │         │───────────────────────────│   │
 │ full_name       │         │ assignment_id          PK │   │
 │ phone (UNQ)     │         │ volunteer_id           FK │   │
 │ email (UNQ)     │         │ event_name                │   │
 │ skills          │         │ assigned_date             │   │
 │ availability    │         │ feedback                  │   │
 │ status (ENUM)   │         │ status (ENUM)             │   │
 └─────────────────┘         └───────────────────────────┘   │
                                                               │
 ┌───────────────────────────────────────────────────────────┐│
 │                         child                              ││
 │───────────────────────────────────────────────────────────││
 │ child_id PK  │ full_name │ date_of_birth │ gender (ENUM)  ││
 │ admission_date │ guardian_name │ blood_group │ photo       ││
 │ status (ENUM)                                             ││
 └───────────────────────────────────────────────────────────┘│
       │ 1          │ 1          │ 1          │ 1          │ 1 │
       │            │            │            │            │   │
       ▼ M          ▼ M          ▼ M          ▼ M          ▼ M ┘
 ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐
 │  health  │ │education │ │achievement│ │    alert    │
 │──────────│ │──────────│ │──────────│ │─────────────│
 │health_id │ │education │ │achievement│ │ alert_id PK │
 │child_id  │ │_id PK    │ │_id PK    │ │ child_id FK │
 │height_cm │ │child_id  │ │child_id  │ │ alert_type  │
 │weight_kg │ │class_name│ │title     │ │ message     │
 │checkup_  │ │subject   │ │description│ │ created_date│
 │date      │ │marks     │ │achievement│ │ status(ENUM)│
 │notes     │ │exam_date │ │_date     │ └─────────────┘
 │status    │ │remarks   │ │category  │
 └──────────┘ └──────────┘ └──────────┘

================================================================================
  RELATIONSHIP SUMMARY
================================================================================

  users          1 ──► M   login                (user_id FK, CASCADE)
  users          1 ──► M   attendance           (marked_by FK, SET NULL)
  child          1 ──► M   attendance           (child_id FK, CASCADE)
  child          1 ──► M   education            (child_id FK, CASCADE)
  child          1 ──► M   health               (child_id FK, CASCADE)
  child          1 ──► M   achievement          (child_id FK, CASCADE)
  child          1 ──► M   alert                (child_id FK, CASCADE)
  donor          1 ──► M   donation             (donor_id FK, CASCADE)
  volunteer      1 ──► M   volunteer_assignment (volunteer_id FK, CASCADE)

  Total Tables   : 12
  Total ENUMs    : 13
  Total FK Links : 9
  Total Indexes  : 24
================================================================================
*/
