# System Architecture - 1 Stop Party System

## High-Level Flow
1. **Frontend (React)** calls **Laravel API** via Axios
2. **Laravel** handles routes, business logic, role-based middleware
3. **MySQL** stores users, roles, meetings, events, members, finances
4. **File Storage** for uploads (pdf, docx, xls, csv)

## Modules
- Dashboard (stats + graphs)
- Users (CRUD + roles)
- Meetings (CRUD + file upload)
- Events (CRUD + category by role)
- Members (CRUD + import/export)
- Profile Settings

---

## Database Schema (Main Tables)
- `users` → id, name, email, password, role_id, profile_image
- `roles` → id, name (Admin, Anggota Cabang, Bendahari, etc.)
- `meetings` → id, title, date, file_path, created_by, role_id
- `events` → id, title, description, location, time, category (Cabang/AMK/Wanita), created_by
- `members` → id, name, ic_no, phone, email, uploaded_by
- `finances` → id, balance, transaction_date, type, notes

---

## API Structure
- `/api/auth/*` → login, logout, register
- `/api/users/*` → CRUD users
- `/api/meetings/*` → CRUD meetings + file upload
- `/api/events/*` → CRUD events
- `/api/members/*` → CRUD + import/export
- `/api/dashboard/*` → cards & charts
