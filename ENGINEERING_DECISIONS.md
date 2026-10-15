# Engineering Decisions

This document describes decisions reflected in the current implementation, along with known limitations and possible next steps.

## 1. Why did you choose your project architecture?

The React/Vite client and Node.js/Express API are separate applications so they can be developed and deployed independently. On the server, routes compose authentication, role authorization, request validation, and controller handlers. Controllers remain HTTP adapters; services own business logic and persistence; Mongoose models define document structure and database constraints. Shared middleware and utilities handle errors, response envelopes, audit events, workflow transitions, calendar dates, and slot generation.

Socket.IO shares the API's HTTP server and authenticates connections using access JWTs. Appointment writes emit small invalidation events only after persistence and audit logging, rather than implementing booking rules a second time in socket handlers. The client uses React Router for navigation, the single role-and-navigation configuration in `client/src/config/roleConfig.js`, and one Axios instance in `client/src/api/api.js`. That API module applies the access token, coordinates one refresh request when several calls expire together, retries an unauthorized request once after successful refresh, and provides the shared request/login/logout helpers. React Query owns server state, and Socket.IO events invalidate cached appointment and slot data.

## 2. How did you design your MongoDB schema?

The collections model staff identity, doctor-specific data, patient identity, scheduling, appointment lifecycle, and audit history:

- **User** stores name, normalized name, email, bcrypt password hash, role, optional department, active state, and one current hashed refresh token. Password and refresh-token hashes are excluded from default projections/JSON output.
- **Doctor** is a profile linked uniquely to a User and stores the department.
- **Schedule** stores one weekly schedule per doctor: working weekday numbers, an array of sessions, a shared slot duration, named breaks, and an active flag. All sessions apply to each selected working day.
- **Patient** stores demographics and a generated immutable yearly patient ID. A separate per-year counter allocates IDs atomically.
- **Appointment** references a Patient and Doctor, stores a department snapshot, clinic calendar date, local slot start, purpose, notes, status, and an `isActive` reservation flag.
- **AuditLog** stores actor, role, action, outcome where relevant, target entity, request context, and timestamp. Appointment audit metadata avoids copying clinical notes and patient details.

The appointment's department snapshot preserves the department used at booking time. The calendar date is normalized to UTC midnight; the slot time is `HH:mm` in the configured clinic time zone. References allow patient, staff, and appointment lifecycles to be managed independently; the complete weekly schedule is embedded in one schedule document because slot generation loads it as a unit.

## 3. How did you prevent double booking?

The appointment service first checks that the requested doctor/date/start is an available generated slot. This rejects invalid, past, break, and already-booked requests early, but it is not treated as a concurrency guarantee: two requests can both pass that read at the same time.

MongoDB enforces the invariant with a unique partial index on `{ doctorId, date, slotStart }` for documents where `isActive: true`. Under a concurrent race, one insert succeeds and the competing duplicate-key error (`E11000`) is mapped to HTTP `409 Conflict`. The slot lookup is therefore a usability check; the unique index is the final correctness boundary.

The appointment model derives `isActive` from status. `SCHEDULED` and `ARRIVED` reserve the slot; `COMPLETED` and `CANCELLED` release it while retaining the appointment record for history. This mechanism is protected by automated service tests; a true concurrent request against a MongoDB instance should also be exercised in integration/load testing.

## 4. Which database indexes did you create and why?

The following indexes are declared in the current Mongoose models:

- **Appointment:** unique partial `{ doctorId: 1, date: 1, slotStart: 1 }` for active bookings; `{ doctorId: 1, date: 1, status: 1, slotStart: 1 }`; `{ patientId: 1, date: 1 }`; `{ department: 1, date: 1, status: 1 }`; `{ status: 1, date: 1, slotStart: 1 }`; `{ date: 1, slotStart: 1 }`; and `{ createdAt: -1 }`. These support the no-double-booking invariant and appointment ownership, date, status, department, patient-history, and creation-time query paths.
- **Patient:** unique `patientId`; `{ mobile: 1 }`; `{ nameNormalized: 1 }`; `{ nameNormalized: 1, mobile: 1 }`; and a text index over `patientId`, `mobile`, and `name`. The current patient and appointment filters use escaped anchored prefix/exact patterns, not `$text`, so the usefulness of each declared index should be confirmed with production query plans.
- **Doctor:** unique `userId` enforces a single doctor profile per user; `{ department: 1, _id: 1 }` supports department-filtered listing and stable ordering.
- **Schedule:** unique `doctorId` enforces one weekly schedule per doctor.
- **User:** unique `email` enforces login identity uniqueness; `{ nameNormalized: 1, role: 1 }` supports staff name/role lookup.
- **AuditLog:** `{ createdAt: -1 }` supports recent-event retrieval.

Indexes improve reads and enforce selected invariants, but consume storage and add write work. Their real performance impact has not been established with production data; validate hot query plans with `explain()` and revise based on measured workloads.

## 5. What security measures did you implement?

- Passwords are hashed with bcrypt (12 rounds); login checks active users and performs a dummy bcrypt comparison for unknown users.
- Access and refresh JWTs have separate required secrets, explicit token types, expiry settings, and unique token IDs. The database stores only a hash of the current refresh token. Refresh atomically matches and rotates the stored token hash; logout clears the matching hash.
- Authentication and role middleware protect API routes. Appointment services independently scope Doctors to their own doctor profile; Doctors may update only notes and cannot book, cancel, arrive, or complete appointments.
- Socket.IO authenticates access tokens and restricts Doctor subscriptions to their own doctor/date room.
- Joi validates request bodies, query parameters, and IDs. The API applies Helmet, CORS origin allowlisting, a 1 MB request-body limit, request logging, and a configurable rate limit.
- Responses use a common envelope and centralized error handling; unexpected errors do not expose stack traces. Password and refresh-token hashes are not returned.
- Appointment socket payloads omit patient information and notes. Audit events avoid adding patient demographics or clinical notes to metadata.
- The browser currently stores access and refresh token values in `localStorage`. This is a known risk if an XSS vulnerability occurs. A production hardening step is to move refresh tokens to `HttpOnly`, `Secure`, `SameSite` cookies and add appropriate CSRF defenses. Production also requires HTTPS, restricted database access, managed secrets, and operational monitoring.

## 6. What performance optimizations did you apply?

- Appointment and patient listing is server-paginated, uses allowlisted sort options, bounded page sizes, targeted projections, and `lean()` reads where appropriate.
- Patient and doctor text filters resolve matching record IDs before querying appointments; regex input is escaped. Empty matches return without an unnecessary appointment-list query.
- Slot generation calculates candidate slots in memory and makes one appointment query for the selected doctor's date and generated start times to mark booked slots.
- Slots advance by the configured duration from each session start. Break intersections and past instants are skipped; incomplete session-ending slots are omitted.
- React Query caches remote state. Socket.IO appointment events invalidate appointment and relevant slot queries instead of sending sensitive appointment records through the socket.
- Compound database indexes target the appointment, staff, schedule, and patient lookup patterns described above.

These are implementation optimizations, not measured benchmark claims. Confirm query plans, response latency, and index utility with representative clinic data before scaling.

## 7. If this application needed to support millions of appointments, what architectural changes would you make?

I would measure workload and data distribution first, then scale without weakening the database booking constraint:

1. Add clinic/tenant identity to users, doctors, schedules, patients, appointments, and authorization. Choose a tenant-aware partition/shard key from measured access patterns and include the tenant dimension in uniqueness constraints.
2. Operate MongoDB as a properly sized replica set or managed cluster; examine production `explain()` plans; revise indexes; and define retention/archive rules for old terminal appointments.
3. Scale stateless API instances behind a load balancer. Add a Socket.IO Redis adapter or managed pub/sub so rooms broadcast across instances.
4. Move analytics/reporting to read models or an asynchronous pipeline and noncritical work such as notifications/exports to a durable queue.
5. Revisit the per-year patient counter, which can become a write hotspot at very high registration rates; consider block allocation or a distributed identifier strategy if measurements justify it.
6. Add connection-pool sizing, backpressure, autoscaling, observability, backup/restore drills, and load/concurrency tests against a replica-set-backed environment.

Throughout these changes, the unique active-slot constraint and status-driven slot reservation semantics must remain enforced by the database.
