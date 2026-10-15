import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, Clock3, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorMessage, Spinner } from '../components/Feedback.jsx';
import { ROLES } from '../config/roleConfig.js';
import { useRole } from '../hooks/useRole.js';
import { request } from '../api/api.js';

function getToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function DashboardPage() {
  const { hasRole, can } = useRole();
  const isDoctor = hasRole(ROLES.DOCTOR);
  const isSuperAdmin = hasRole(ROLES.SUPER_ADMIN);
  const canBook = can('BOOK_APPOINTMENT');
  const today = getToday();
  const appointmentsQuery = useQuery({
    queryKey: ['appointments', 'dashboard', today],
    queryFn: () => request('/appointments', {
      query: { date: today, page: 1, pageSize: 8, sortBy: 'slotStart', sortOrder: 'asc' },
    }),
  });
  const statusSummaries = useQueries({
    queries: ['SCHEDULED', 'ARRIVED'].map((status) => ({
      queryKey: ['appointments', 'dashboard', today, status],
      queryFn: () => request('/appointments', {
        query: { date: today, status, page: 1, pageSize: 1 },
      }),
    })),
  });
  const doctorsQuery = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => (await request('/doctors')).data,
    enabled: !isDoctor,
  });
  const doctorsById = useMemo(
    () => new Map((doctorsQuery.data || []).map((doctor) => [doctor.id, doctor])),
    [doctorsQuery.data],
  );
  const visits = appointmentsQuery.data?.data || [];
  const total = appointmentsQuery.data?.meta?.total || 0;
  const scheduled = statusSummaries[0].data?.meta?.total;
  const arrived = statusSummaries[1].data?.meta?.total;
  const statCards = isSuperAdmin
    ? [
      { label: 'Appointments today', value: appointmentsQuery.isLoading || appointmentsQuery.isError ? '—' : total, Icon: CalendarDays, color: 'teal' },
      { label: 'Active doctors', value: doctorsQuery.isLoading || doctorsQuery.isError ? '—' : doctorsQuery.data?.length ?? 0, Icon: Stethoscope, color: 'amber' },
      { label: 'Arrived', value: arrived ?? '—', Icon: Clock3, color: 'blue' },
    ]
    : [
      { label: isDoctor ? 'My appointments today' : 'Appointments today', value: appointmentsQuery.isLoading || appointmentsQuery.isError ? '—' : total, Icon: CalendarDays, color: 'teal' },
      { label: isDoctor ? 'To see' : 'Awaiting arrival', value: scheduled ?? '—', Icon: Clock3, color: 'amber' },
      { label: 'Arrived', value: arrived ?? '—', Icon: Stethoscope, color: 'blue' },
    ];

  return (
    <div className="page-stack">
      <section className="page-heading dashboard-heading">
        <div>
          <div className="eyebrow">{isDoctor ? 'MY CLINIC DAY' : 'CLINIC OVERVIEW'}</div>
          <h1>{isDoctor ? 'Good day. Here are your appointments.' : 'Good day. Here’s your schedule.'}</h1>
          <p>{isDoctor ? 'Your appointment activity at a glance.' : 'Today’s appointment activity at a glance.'}</p>
        </div>
        {canBook && <Link className="button button-primary" to="/scheduler"><CalendarDays size={15} /> Book an appointment</Link>}
      </section>

      <section className="dashboard-stats">
        {statCards.map(({ label, value, Icon, color }) => (
          <article className="dashboard-stat" key={label}>
            <span className={`stat-icon stat-icon-${color}`}><Icon size={18} /></span>
            <span><small>{label}</small><strong>{value}</strong></span>
          </article>
        ))}
      </section>
      {doctorsQuery.isError && !isDoctor && <ErrorMessage message={doctorsQuery.error.message} onRetry={doctorsQuery.refetch} />}
      {statusSummaries.some((summary) => summary.isError) && (
        <ErrorMessage
          message="Unable to load today's appointment status totals."
          onRetry={() => statusSummaries.forEach((summary) => summary.refetch())}
        />
      )}

      <section className="list-card dashboard-visits">
        <div className="list-toolbar">
          <div className="list-toolbar-title"><span className="toolbar-icon"><CalendarDays size={17} /></span><span><strong>{isDoctor ? 'My appointments today' : 'Today’s appointments'}</strong><small>{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(`${today}T12:00:00`))}</small></span></div>
          <Link className="text-link" to="/appointments">View all <ArrowRight size={14} /></Link>
        </div>
        {appointmentsQuery.isLoading && <Spinner label="Loading today's schedule" />}
        {appointmentsQuery.isError && <ErrorMessage message={appointmentsQuery.error.message} onRetry={appointmentsQuery.refetch} />}
        {!appointmentsQuery.isLoading && !appointmentsQuery.isError && visits.length === 0 && (
          <EmptyState title="No appointments today" description={isDoctor ? 'You have no appointments scheduled for today.' : 'Your schedule is clear. New bookings will appear here.'} />
        )}
        {!appointmentsQuery.isLoading && !appointmentsQuery.isError && visits.length > 0 && (
          <div className="dashboard-visit-list">
            {visits.map((visit) => {
              const doctor = doctorsById.get(visit.doctorId);
              return (
                <article className="dashboard-visit" key={visit.id}>
                  <span className="dashboard-visit-time">{visit.slotStart}</span>
                  <span className="dashboard-visit-person">
                    <strong>{visit.patient?.name || 'Patient'}</strong>
                    <small>{visit.patient?.patientId || '—'}{visit.patient?.mobile ? ` · ${visit.patient.mobile}` : ''}</small>
                  </span>
                  {!isDoctor && <span className="dashboard-visit-doctor">{doctor?.name || 'Doctor'}<small>{visit.department || doctor?.department || '—'}</small></span>}
                  <span className={`status-badge status-${visit.status.toLowerCase()}`}>{visit.status.toLowerCase()}</span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
