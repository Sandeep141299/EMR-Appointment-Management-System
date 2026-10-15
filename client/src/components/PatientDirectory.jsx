import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  UserPlus,
} from 'lucide-react';
import { EmptyState, ErrorMessage, Spinner } from './Feedback.jsx';
import RoleGate from './RoleGate.jsx';

export default function PatientDirectory({
  form,
  updateForm,
  submitPatient,
  createPatient,
  search,
  setSearch,
  setPage,
  patientQuery,
  patients,
  meta,
  sort,
  changeSort,
  openPatientEditor,
}) {
  return (
    <>
      <section className="staff-card patient-register-card">
        <div className="list-toolbar-title staff-card-heading">
          <span className="staff-card-icon"><UserPlus size={18} /></span>
          <span><strong>Register patient</strong><small>A unique patient ID is assigned automatically.</small></span>
        </div>
        <form className="staff-form patient-register-form" onSubmit={submitPatient}>
          <label className="field">Full name<input name="name" value={form.name} onChange={updateForm} maxLength={120} required autoComplete="name" /></label>
          <label className="field">Mobile number<input name="mobile" type="tel" value={form.mobile} onChange={updateForm} maxLength={20} required autoComplete="tel" /></label>
          <label className="field">Email address<input name="email" type="email" value={form.email} onChange={updateForm} maxLength={254} autoComplete="email" /></label>
          <label className="field">Date of birth<input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateForm} /></label>
          <label className="field">Gender<select name="gender" value={form.gender} onChange={updateForm}>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
            <option value="NON_BINARY">Non-binary</option>
            <option value="OTHER">Other</option>
          </select></label>
          <label className="field patient-address-field">Address<textarea name="address" value={form.address} onChange={updateForm} maxLength={500} rows={2} /></label>
          {createPatient.isError && <ErrorMessage message={createPatient.error.message} />}
          <button className="button button-primary" type="submit" disabled={createPatient.isPending}>
            <UserPlus size={15} /> {createPatient.isPending ? 'Creating patient…' : 'Create patient'}
          </button>
        </form>
      </section>
      <section className="list-card patient-table-card">
        <div className="list-toolbar">
          <div className="staff-card-heading">
            <span className="staff-card-icon"><Search size={18} /></span>
            <span><strong>Patient records</strong><small>Browse and search all registered patients.</small></span>
          </div>
          <label className="field filter-field patient-search-field">Search patients
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Patient ID, name, or mobile" />
          </label>
        </div>
        {patientQuery.isError && <ErrorMessage message={patientQuery.error.message} onRetry={patientQuery.refetch} />}
        <PatientTable
          patients={patients}
          search={search}
          patientQuery={patientQuery}
          meta={meta}
          sort={sort}
          changeSort={changeSort}
          setPage={setPage}
          openPatientEditor={openPatientEditor}
        />
      </section>
    </>
  );
}

function PatientTable({ patients, search, patientQuery, meta, sort, changeSort, setPage, openPatientEditor }) {
  return (
    <>
      {patientQuery.isLoading ? <Spinner label="Loading patients" /> : <div className="table-overflow">
        <table className="appointments-table patients-table">
          <thead>
            <tr>
              <th><button className="sort-heading" type="button" onClick={() => changeSort('name')}>Patient {sort.sortBy === 'name' && (sort.sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>
              <th><button className="sort-heading" type="button" onClick={() => changeSort('patientId')}>Patient ID {sort.sortBy === 'patientId' && (sort.sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>
              <th>Mobile</th><th>Email</th><th>Date of birth</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td><div className="table-person"><span className="patient-avatar">{patient.name?.slice(0, 1)?.toUpperCase() || 'P'}</span><strong>{patient.name}</strong></div></td>
                <td>{patient.patientId}</td><td>{patient.mobile}</td><td>{patient.email || '—'}</td>
                <td>{patient.dateOfBirth ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(patient.dateOfBirth)) : '—'}</td>
                <td><div className="patient-row-actions">
                  <RoleGate permission="VIEW_PATIENTS">
                    <button className="button button-subtle patient-book-link" type="button" onClick={() => openPatientEditor(patient)}><Pencil size={14} /> Edit</button>
                  </RoleGate>
                  <RoleGate permission="BOOK_APPOINTMENT">
                    <Link className="button button-subtle patient-book-link" to={`/scheduler?patientId=${encodeURIComponent(patient.patientId)}`}>Book appointment</Link>
                  </RoleGate>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!patients.length && !patientQuery.isError && (
          <EmptyState title={search ? 'No patients found' : 'No patients yet'} description={search ? 'Try a different patient ID, name, or mobile number.' : 'Registered patients will appear here.'} />
        )}
      </div>}
      <div className="table-footer">
        <span>Showing <strong>{meta?.total ? (meta.page - 1) * meta.pageSize + 1 : 0}–{Math.min(meta?.page * meta?.pageSize || 0, meta?.total || 0)}</strong> of <strong>{meta?.total ?? 0}</strong> patients</span>
        <div className="pagination">
          <button type="button" className="icon-button" aria-label="Previous page" disabled={!meta?.hasPreviousPage || patientQuery.isFetching} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={17} /></button>
          <span>Page <strong>{meta?.page || 1}</strong> of <strong>{meta?.totalPages || 1}</strong></span>
          <button type="button" className="icon-button" aria-label="Next page" disabled={!meta?.hasNextPage || patientQuery.isFetching} onClick={() => setPage((current) => current + 1)}><ChevronRight size={17} /></button>
        </div>
      </div>
    </>
  );
}
