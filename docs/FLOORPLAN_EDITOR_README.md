Floor Plan Editor — Overview

This document explains the new FloorPlan Editor (admin) features added to the project.

Location:
- Frontend page: `/admin/floorplan` (component: `src/pages/admin/FloorPlanEditor.tsx`)
- Canvas: `src/components/FloorPlanCanvas.tsx`
- Backend migration: `backend/migrations/003_floorplan_versions.sql`

Features:
- Drag-and-drop table positioning with optimistic saves and rollback on failure.
- Create / Update / Delete tables via existing API endpoints.
- Area management (create / update / delete floor areas).
- CSV import (via existing `POST /organizations/:orgId/tables/import`) and CSV export.
- Manager/admin route-protected and role-aware UI controls.

Manual test steps:
1. Start backend and frontend locally (see DEPLOYMENT_GUIDE.md).
2. Login as `manager` or `admin`.
3. Navigate to `/admin/floorplan`.
4. Drag a table — observe "Saving positions..." indicator.
5. If network error occurs, positions roll back and an error message appears.
6. Select a table and edit properties in the right panel; click Save.
7. Add/delete areas using the Areas panel.
8. Import a CSV via the Import control and verify tables appear.
9. Export CSV to confirm format matches sample.

Notes for developers:
- `FloorPlanCanvas` now exposes `onSaveStart`, `onSaveEnd`, and `onSaveError` callbacks.
- The backend migration adds `floorplan_versions` to store snapshots; consider adding snapshot/restore endpoints in the future.
