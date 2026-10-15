# Engineering Decisions

Short notes on why I built the EMR Appointment module the way I did.

## 1. Architecture

I kept the React (Vite) client and the Express API as two separate apps so each can be developed and deployed on its own.

On the server I followed a simple flow: **route → auth/role check → validation → controller → service → model**.
- Controllers are thin; they only read the request and send the response.
- Services hold the business logic (booking rules, slot generation, status changes).
- Shared helpers handle errors, the response format, audit logs, and dates.

On the client, React Router handles pages, one Axios instance handles all API calls (including refreshing the token once if it expires), and React Query handles server data. One file, `roleConfig.js`, controls which menus and routes each role sees.

Socket.IO runs on the same HTTP server. It only sends small "something changed" events after a successful save, so the client refetches data. I didn't want booking rules duplicated inside socket code.

## 2. MongoDB schema

- **User**: name, email, hashed password, role, department, active flag, hashed refresh token.
- **Doctor**: linked one-to-one with a User, stores department.
- **Schedule**: one per doctor. Working days, sessions, slot duration, and breaks are stored in a single document because slot generation needs all of them together.
- **Patient**: details plus an auto-generated yearly patient ID (a counter keeps IDs unique).
- **Appointment**: references Patient and Doctor, stores the department at booking time, date, slot start, purpose, notes, status, and an `isActive` flag.
- **AuditLog**: who did what, on which entity, and when.

I used references between collections so patients, staff, and appointments can change independently.

## 3. Preventing double booking

Before saving, the service checks that the slot is valid and free. That check gives a quick, friendly error, but two requests can pass it at the same time, so it is not enough by itself.

The real protection is a **unique partial index** on `{ doctorId, date, slotStart }` where `isActive: true`. If two users book the same slot together, one insert succeeds and the other fails with a duplicate-key error (`E11000`), which I return as **409 Conflict**.

`SCHEDULED` and `ARRIVED` keep the slot reserved. `CANCELLED` and `COMPLETED` release it, but the record stays for history.

## 4. Indexes

- **Appointment**: the unique partial index above, plus indexes for doctor + date + status, patient + date, department + date + status, and `createdAt`. These match how appointments are listed and filtered.
- **Patient**: unique `patientId`, and indexes on mobile and normalized name for searching.
- **Doctor / Schedule / User**: unique constraints (one profile per user, one schedule per doctor, unique email).
- **AuditLog**: `createdAt` for recent logs.

I haven't tested these with large data yet. Before going live I would check the real query plans with `explain()`.

## 5. Security

- Passwords hashed with bcrypt (12 rounds).
- Separate secrets for access and refresh JWTs. Only a hash of the refresh token is stored; it rotates on refresh and is cleared on logout.
- Auth and role middleware on the routes. Doctors are also restricted inside the service to their own appointments, and can only update notes.
- Joi validation, Helmet, CORS allowlist, request size limit, and rate limiting.
- Errors never show stack traces, and password or token hashes are never returned.
- Socket connections need a valid token, and doctors can only join their own rooms. Socket events contain no patient data or notes.

**Known weakness:** tokens are stored in `localStorage`, which is risky if there is an XSS bug. The next step would be `HttpOnly` cookies with CSRF protection.

## 6. Performance

- Server-side pagination, sorting (from an allowed list), and filtering, with `lean()` and limited fields.
- Patient/doctor searches find matching IDs first, and skip the appointment query if nothing matches.
- Slots are generated in memory, with only one database query to find the booked ones.
- React Query caching, and socket events that refresh only the affected appointment and slot data.
- Indexes that match the main queries.

These are sensible optimizations, not benchmarked results.

## 7. Scaling to millions of appointments

1. Add a clinic/tenant ID everywhere and pick a shard key based on real access patterns.
2. Run MongoDB as a replica set or managed cluster, review query plans, and archive old appointments.
3. Run several API instances behind a load balancer, with a Redis adapter so Socket.IO works across them.
4. Move reports and notifications to background jobs or queues.
5. Re-check the yearly patient ID counter, since it could become a bottleneck.
6. Add monitoring, backups, and load tests.

Whatever changes, the unique active-slot index stays in the database as the final safeguard against double booking.