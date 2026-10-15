import { memo } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import AppointmentActions from './AppointmentActions.jsx';
import { EmptyState, ErrorMessage, Spinner } from './Feedback.jsx';

function formatAppointmentDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status?.toLowerCase()}`}>{status?.toLowerCase()}</span>;
}

const AppointmentRows = memo(function AppointmentRows({ appointments, doctorsById, isDoctor }) {
  return appointments.map((appointment) => {
    const doctor = doctorsById.get(appointment.doctorId);
    return (
      <tr key={appointment.id}>
        <td><div className="table-person"><span className="patient-avatar">{appointment.patient?.name?.slice(0, 1)?.toUpperCase() || 'P'}</span><span><strong>{appointment.patient?.name || 'Patient'}</strong><small>{appointment.patient?.patientId || '—'}{appointment.patient?.mobile ? ` · ${appointment.patient.mobile}` : ''}</small></span></div></td>
        <td><span className="table-doctor">{isDoctor ? 'You' : doctor?.name || 'Doctor'}</span><small className="table-secondary">{appointment.department || doctor?.department || '—'}</small></td>
        <td><span className="table-date">{formatAppointmentDate(appointment.date)}</span><small className="table-secondary">{appointment.slotStart}</small></td>
        <td><span className="purpose-cell">{appointment.purpose || '—'}</span></td>
        <td><StatusBadge status={appointment.status} /></td>
        <td><AppointmentActions appointment={appointment} /></td>
      </tr>
    );
  });
});

export default function AppointmentsTable({
  appointments,
  doctorsById,
  isDoctor,
  query,
  meta,
  startItem,
  endItem,
  filters,
  setFilters,
  updatePage,
  currentPage,
}) {
  return (
    <>
      <div className="table-overflow">
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Patient</th><th>Doctor & department</th>
              <th>
                <button
                  className="sort-heading"
                  type="button"
                  onClick={() => setFilters((current) => ({
                    ...current,
                    sortBy: 'date',
                    sortOrder: current.sortOrder === 'asc' ? 'desc' : 'asc',
                    page: 1,
                  }))}
                >
                  Date &amp; time {filters.sortBy === 'date' && (filters.sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
                </button>
              </th>
              <th>Purpose</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody><AppointmentRows appointments={appointments} doctorsById={doctorsById} isDoctor={isDoctor} /></tbody>
        </table>
        {query.isLoading && <Spinner label="Loading appointments" />}
        {query.isError && <ErrorMessage message={query.error.message} onRetry={query.refetch} />}
        {!query.isLoading && !query.isError && appointments.length === 0 && (
          <EmptyState title="No appointments found" description="Try adjusting your filters or check back later." />
        )}
      </div>
      <div className="table-footer">
        <span>Showing <strong>{startItem}–{endItem}</strong> of <strong>{meta?.total ?? 0}</strong> appointments</span>
        <div className="pagination">
          <button type="button" className="icon-button" aria-label="Previous page" disabled={!meta?.hasPreviousPage || query.isFetching} onClick={() => updatePage(currentPage - 1)}><ChevronLeft size={17} /></button>
          <span>Page <strong>{meta?.page || 1}</strong> of <strong>{meta?.totalPages || 1}</strong></span>
          <button type="button" className="icon-button" aria-label="Next page" disabled={!meta?.hasNextPage || query.isFetching} onClick={() => updatePage(currentPage + 1)}><ChevronRight size={17} /></button>
        </div>
      </div>
    </>
  );
}
