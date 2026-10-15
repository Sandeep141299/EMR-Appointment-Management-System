# API Documentation

Base path: `/api/v1`

All responses use this envelope:

```json
{
  "success": true,
  "message": "Appointments retrieved",
  "data": [],
  "meta": null
}
```

Authenticated API calls require `Authorization: Bearer <accessToken>`. Except for health and the authentication/token endpoints, all API endpoints require authentication and an allowed role. Dates use the clinic calendar (`TIME_ZONE`, default `Asia/Kolkata`) in `YYYY-MM-DD` format; times use 24-hour `HH:mm`.

## Authentication

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/auth/login` | Public |
| `POST` | `/auth/refresh` | Public; refresh token required |
| `POST` | `/auth/logout` | Public; refresh token required |

Login body:

```json
{ "email": "admin@example.com", "password": "your-password" }
```

Successful login returns `data.user`, `data.accessToken`, and `data.refreshToken`. Refresh and logout bodies use `{ "refreshToken": "<token>" }`. Refresh rotates the refresh token and returns the new token pair. Logout invalidates the submitted token. Invalid credentials and expired/invalid tokens return `401`.

## Doctors and schedules

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/doctors?department=Cardiology` | Super Admin, Receptionist, Doctor |
| `POST` | `/admin/doctors` | Super Admin |
| `POST` | `/admin/receptionists` | Super Admin |
| `GET` | `/admin/users?role=DOCTOR` | Super Admin |
| `PATCH` | `/admin/users/:id` | Super Admin |
| `GET` | `/admin/audit-logs?page=1&pageSize=25` | Super Admin |
| `GET` | `/doctors/:id/schedule` | Super Admin, Receptionist, Doctor (own schedule only) |
| `PUT` | `/doctors/:id/schedule` | Super Admin |

Doctor create body:

```json
{
  "name": "Dr. Example",
  "email": "doctor@example.com",
  "password": "a-strong-password",
  "department": "Cardiology"
}
```

Receptionist body has `name`, `email`, and `password`, with optional `department`. Password requirements are enforced by Joi. Schedule body:

```json
{
  "workingDays": [1, 2, 3, 4, 5],
  "sessions": [
    { "name": "Morning", "startTime": "09:00", "endTime": "12:00" },
    { "name": "Evening", "startTime": "13:00", "endTime": "17:00" }
  ],
  "slotDuration": 30,
  "breaks": [{ "name": "Lunch", "startTime": "12:00", "endTime": "13:00" }],
  "isActive": true
}
```

The staff directory accepts `role=DOCTOR` or `role=RECEPTIONIST`. Staff updates accept a non-empty subset of `name`, `email`, `department`, and `isActive`. A doctor's department is synchronized to both the user and doctor profile; a doctor must retain a non-empty department. Password changes are not part of this update endpoint.

The Super Admin Staff directory (`/doctors`) requests both role directories and displays Doctors and Receptionists in separate sections at the same time.

`GET /admin/audit-logs` returns newest-first audit events with pagination metadata (`page`, `pageSize`, `total`, `totalPages`, `hasNextPage`, `hasPreviousPage`). `pageSize` defaults to 25 and is capped at 100. The response includes timestamp, action, outcome, actor name/email, role, and target identifiers; it omits IP addresses, user-agent strings, and arbitrary metadata.

Working days use JavaScript weekday numbers (`0` is Sunday through `6` Saturday). Session and break times use 24-hour `HH:mm`. Sessions cannot overlap other sessions, and breaks cannot overlap other breaks; a break may overlap a session and is omitted from slot generation. Slot duration must be a positive integer. Slots are generated from each session's start in duration-sized increments; any remainder too short for a complete slot at the end of a session is omitted. `isActive: false` disables slot generation. Doctors can retrieve only their own schedule; schedule writes are Super Admin-only. Invalid schedules return `400`. Legacy schedule records from the previous per-day format are flagged on schedule retrieval and need to be reviewed and saved in the new format before slots are generated.

## Slots

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/slots?doctorId=<ObjectId>&date=YYYY-MM-DD` | Super Admin, Receptionist, Doctor |

Returns a `data` array of `{ "slotStart", "slotEnd", "status" }`, where status is `available` or `booked`. Past dates/times, breaks, and slots that do not fit completely within a session are omitted.

## Patients and appointments

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/patients?search=<prefix>&page=1&pageSize=20&sortBy=name&sortOrder=asc` | Super Admin, Receptionist |
| `POST` | `/patients` | Super Admin, Receptionist |
| `PATCH` | `/patients/:patientId` | Super Admin, Receptionist |
| `POST` | `/appointments` | Super Admin, Receptionist |
| `GET` | `/appointments` | Super Admin, Receptionist, Doctor |
| `GET` | `/appointments/:appointmentId` | Super Admin, Receptionist, Doctor |
| `PATCH`, `PUT` | `/appointments/:appointmentId` | Super Admin, Receptionist, Doctor |
| `POST` | `/appointments/:appointmentId/arrive` | Super Admin, Receptionist |
| `POST` | `/appointments/:appointmentId/complete` | Super Admin |
| `POST` | `/appointments/:appointmentId/cancel` | Super Admin, Receptionist |
| `DELETE` | `/appointments/:appointmentId` | Super Admin, Receptionist; cancel alias |

Patient listing returns paginated records (default 20, maximum 100) and can optionally filter by patient ID, mobile prefix, or normalized name prefix. `sortBy` accepts `name`, `patientId`, or `createdAt`. New patients are automatically assigned a yearly `PT-<year>-<sequence>` ID.

Standalone patient registration accepts `name` and `mobile`, with optional `email`, `dateOfBirth` (`YYYY-MM-DD`), `gender`, `address`, and `emergencyContact`:

```json
{
  "name": "Sam Patient",
  "mobile": "+15555550123",
  "email": "sam@example.test",
  "dateOfBirth": "1990-08-15",
  "gender": "PREFER_NOT_TO_SAY"
}
```

The response includes the generated patient ID and safe patient profile fields. Registration is audit logged without copying patient demographics into the audit metadata.

Patient updates accept any non-empty combination of `name`, `mobile`, `email`, `dateOfBirth`, `gender`, `address`, and `emergencyContact`. Set `email` or `dateOfBirth` to `null` to clear it. The generated `patientId` is immutable. Update actions are audit logged with the names of changed fields only.

Create an appointment for an existing patient:

```json
{
  "patientId": "PT-2026-000042",
  "doctorId": "665000000000000000000001",
  "date": "2026-10-20",
  "slotStart": "09:00",
  "purpose": "Follow-up",
  "notes": "Bring previous test results"
}
```

For a new patient, replace `patientId` with a `patient` object containing required `name` and `mobile` and optional patient profile fields. Exactly one of `patientId` or `patient` is required. Department is copied from the selected doctor's profile into the appointment at booking time. The API derives the slot end from the schedule; clients cannot supply an arbitrary slot.

`PATCH`/`PUT` update bodies accept one or both of `purpose` and `notes` for Super Admin and Receptionist; Doctors may update `notes` only on their own appointments. Doctors cannot create appointments, mark patients arrived, complete or cancel appointments. Receptionists can search patients, book and update appointments, mark patients arrived, and cancel appointments. Super Admins can perform all appointment operations. The status workflow is `SCHEDULED → ARRIVED → COMPLETED`; `SCHEDULED` and `ARRIVED` can transition to `CANCELLED` by Super Admin or Receptionist. Completed/cancelled appointments are terminal.

Appointment list filters:

| Query | Meaning |
| --- | --- |
| `patientId` | Exact, case-insensitive generated patient ID |
| `patientName` | Case-insensitive patient-name prefix |
| `mobile` | Mobile-number prefix |
| `doctorId` | Exact doctor ID |
| `doctorName` | Case-insensitive doctor-name prefix |
| `department` | Department snapshot |
| `status` | `SCHEDULED`, `ARRIVED`, `COMPLETED`, or `CANCELLED` |
| `date` | Exact clinic calendar date |
| `dateFrom`, `dateTo` | Inclusive date range; cannot be combined with `date` |
| `page`, `pageSize` | Defaults to 1 and 20; page size maximum is 100 |
| `sortBy`, `sortOrder` | `date`, `slotStart`, `createdAt`, or `status`; ascending/descending |

Lists return appointments in `data`; `meta` contains `page`, `pageSize`, `total`, `totalPages`, `hasNextPage`, and `hasPreviousPage`. Doctors are always scoped to their own doctor profile, even when a different `doctorId` filter is submitted.

## Errors and HTTP statuses

Errors retain the response envelope with `success: false`, a safe message, and `data`/`meta` set to `null`.

| Status | Meaning |
| --- | --- |
| `400` | Invalid request or schedule |
| `401` | Missing/invalid authentication or invalid credentials |
| `403` | Authenticated role is not permitted |
| `404` | Requested entity not found |
| `409` | Slot already booked or invalid workflow transition |
| `429` | API rate limit exceeded |
| `500` | Unexpected server error (no stack trace in response) |

## Real-time events

Socket.IO connects to the API origin using `auth: { "token": "<accessToken>" }`. Super Admin and Receptionist sockets join the administrative appointment room. A Doctor can subscribe only to their own doctor/date room using:

```js
socket.emit('appointment:subscribe', {
  doctorId: '<doctor ObjectId>',
  date: '2026-10-20',
});
```

The server emits `appointment:created`, `appointment:updated`, and `appointment:cancelled` after the successful write and audit record. Event payloads contain appointment ID, doctor ID, clinic date, slot start, and status; they omit patient information and notes. Clients should use events to invalidate/refetch API data, not treat event messages as authoritative records.
