# Technical Handover Document: Table Reservation System

**Date:** March 19, 2026
**Project State:** Mid-Integration (Frontend Prototype → Production Full-Stack)
**Backend Status:** Deployed to Fly.io (`https://table-reservation-system.fly.dev/api/v1`)
**Frontend Status:** Local/Vercel. Core foundation and public/auth routes are integrated. Internal admin dashboards remain unintegrated prototypes.

---

## 1. Architecture & Foundation (COMPLETED)

The frontend now has a robust data layer. **Do not use `fetch` or `axios` directly.**

*   **API Client (`src/lib/api.ts`):** 
    *   **Mandatory:** ALL backend requests must go through the `api` object exported here (`api.get`, `api.post`, etc.).
    *   **Features:** It automatically attaches the JWT (`localStorage.getItem('trs_token')`), catches 401s, attempts a silent refresh via `/auth/refresh`, and throws a standardized `ApiError` class on failure.
*   **Auth State (`src/context/AuthContext.tsx`):**
    *   Contains the source of truth for the logged-in user (`user`), their organization (`restaurant`), and auth status. 
    *   Provides `login()`, `signup()`, `staffLogin()`, and `logout()` methods.
*   **Routing (`src/App.tsx` & `src/components/ProtectedRoute.tsx`):**
    *   Routes are strictly segregated. `ProtectedRoute` enforces authentication and Role-Based Access Control (RBAC).

---

## 2. Integrated Features (COMPLETED)

The following flows are 100% wired to the backend. **Use these files as reference implementations for how to handle loading states, error boundaries, and API calls.**

### Auth Flow
*   `src/pages/Login.tsx` → `POST /auth/login`
*   `src/pages/SignUp.tsx` → `POST /auth/signup`
*   `src/pages/StaffLogin.tsx` → `POST /auth/staff-login`

### Onboarding Flow
*   `src/pages/setup/SetupWizard.tsx` is fully integrated, tracking progress via `PATCH /organizations/:id/setup`.
    *   Step 1: `PUT /organizations/:id` (Details)
    *   Step 2: `POST /organizations/:id/tables/import` (CSV Upload)
    *   Step 3: `PUT /organizations/:id` (Rules)
    *   Step 4: `POST /organizations/:id/staff/invite` (Team Invites)

### Customer Facing
*   `src/pages/public-reservation/BookATableWizard.tsx`: Final step submits to `POST /public/:slug/reserve`.
*   `src/pages/CustomerDashboard.tsx`: Completely dynamic. Fetches from `GET /customers/me/reservations/upcoming` and `/history`. Implements live cancellation.

---

## 3. STRICT TO-DO LIST (REMAINING WORK)

The next developer **MUST** complete the following integrations. The frontend components exist but are currently using dummy data arrays and mock `navigate()` functions.

### Phase A: Internal Reservation Creation
Currently, internal bookings do not hit the database.
1.  **`src/pages/reservation/ReservationWizard.tsx` (Staff Booking):** Wire to `POST /reservations`.
2.  **`src/pages/user-reservation/UserReservationWizard.tsx`:** Wire to `POST /reservations`.
3.  **`src/pages/public-reservation/BookATableWizard.tsx` (Step 1/2):** The time slot selection currently allows any time to be clicked. You must wire this to `GET /public/:slug/availability` to disable slots that are fully booked based on capacity.

### Phase B: Admin Dashboard (`/admin`)
The entire admin panel (`src/pages/admin/*`) is static. Remove all hardcoded `const reservations = [...]` arrays.

4.  **`AdminDashboard.tsx`:** Fetch the 4 top-level KPIs (Today's Bookings, Seated Now, Tables, Total Staff) from `GET /dashboard/stats`.
5.  **`tabs/ReservationTab.tsx`:** 
    *   Fetch list from `GET /reservations`.
    *   Wire the status update dropdowns to `PATCH /reservations/:id/status`.
6.  **`tabs/TablesManagementTab.tsx` & `tabs/FloorMapTab.tsx`:** 
    *   Fetch from `GET /tables` and `GET /tables/areas`.
    *   Wire the "Add Table" and "Edit" modals to the respective POST/PUT endpoints.
7.  **`tabs/StaffManagementTab.tsx`:** 
    *   Fetch from `GET /staff`.
    *   Wire the "Remove" and role change functionalities.

### Phase C: Deployment Security
8.  **Backend Environment:** The `backend/.env` file committed to the repo contains real Supabase keys and JWT secrets. 
    *   **ACTION REQUIRED:** Run `fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... JWT_SECRET=...` in the Fly.io CLI. 
    *   Then, scrub these values from the `.env` file and rotate the JWT secret before public launch.

---

## Technical Directives for Next Developer
*   **No Dummy Data:** If an endpoint doesn't exist, build it. Do not leave hardcoded arrays in the UI.
*   **Use `ApiError`:** Always wrap API calls in `try/catch` and check `if (err instanceof ApiError)` to display backend-provided error messages directly in the UI.
*   **Loading States:** Never allow a form submission without disabling the submit button and showing a loading indicator (`isLoading` state).
