import { memo, useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AppointmentsTable from '../components/AppointmentsTable.jsx';
import { EmptyState, ErrorMessage } from '../components/Feedback.jsx';
import { ROLES } from '../config/roleConfig.js';
import { useRole } from '../hooks/useRole.js';
import { request } from '../api/api.js';

const STATUS_OPTIONS = ['SCHEDULED', 'ARRIVED', 'COMPLETED', 'CANCELLED'];

const defaultFilters = {
  patientId: '',
  patientName: '',
  mobile: '',
  doctorName: '',
  department: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  pageSize: 10,
  sortBy: 'date',
  sortOrder: 'asc',
};

const FilterField = memo(function FilterField({ label, ...props }) {
  return <label className="field filter-field"><span>{label}</span><input {...props} /></label>;
});

function AppointmentsPage() {
  const { hasRole, can } = useRole();
  const isDoctor = hasRole(ROLES.DOCTOR);
  const [filters, setFilters] = useState(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const queryFilters = useMemo(() => ({
    ...filters,
    page: filters.page,
    pageSize: filters.pageSize,
  }), [filters]);

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', queryFilters],
    queryFn: () => request('/appointments', { query: queryFilters }),
    placeholderData: (previousData) => previousData,
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

  const updateFilter = useCallback((event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value, page: 1 }));
  }, []);

  const updatePage = useCallback((page) => {
    setFilters((current) => ({ ...current, page }));
  }, []);

  const clearFilters = () => setFilters(defaultFilters);

  const appointments = appointmentsQuery.data?.data || [];
  const meta = appointmentsQuery.data?.meta;
  const startItem = meta?.total ? (meta.page - 1) * meta.pageSize + 1 : 0;
  const endItem = Math.min(meta?.page * meta?.pageSize || 0, meta?.total || 0);

  return (
    <div className="page-stack">
      <section className="page-heading list-heading">
        <div>
          <div className="eyebrow">PATIENT VISITS</div>
          <h1>{isDoctor ? 'My appointments' : 'Appointments'}</h1>
          <p>{isDoctor ? 'Review your visits and update consultation notes.' : 'Search, review, and manage your clinic’s appointments.'}</p>
        </div>
        <div className="appointments-heading-actions">
          {can('BOOK_APPOINTMENT') && (
            <Link className="button button-primary" to="/scheduler">Book appointment</Link>
          )}
          <div className="appointments-count"><span className="count-icon"><CalendarDays size={17} /></span><span><strong>{meta?.total ?? '—'}</strong><small>Total visits</small></span></div>
        </div>
      </section>
      {!isDoctor && doctorsQuery.isError && <ErrorMessage message={doctorsQuery.error.message} onRetry={doctorsQuery.refetch} />}

      <section className="list-card">
        <div className="list-toolbar">
          <div className="list-toolbar-title"><span className="toolbar-icon"><CalendarDays size={17} /></span><span><strong>{isDoctor ? 'My appointments' : 'All appointments'}</strong><small>{isDoctor ? 'Your assigned clinic visits' : 'Browse your clinic schedule'}</small></span></div>
          <label className="field sort-field"><span>Sort by</span><select name="sortBy" value={filters.sortBy} onChange={updateFilter}>
            <option value="date">Appointment date</option>
            <option value="slotStart">Slot time</option>
            <option value="createdAt">Created time</option>
            <option value="status">Status</option>
          </select></label>
          <button className="button button-subtle sort-order-button" type="button" onClick={() => setFilters((current) => ({ ...current, sortOrder: current.sortOrder === 'asc' ? 'desc' : 'asc', page: 1 }))}>
            {filters.sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />} {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </button>
          <button className={`button button-subtle${filtersOpen ? ' is-open' : ''}`} type="button" onClick={() => setFiltersOpen((open) => !open)}>
            <SlidersHorizontal size={15} /> Filters
          </button>
        </div>

        {filtersOpen && (
          <div className="appointment-filters">
            <FilterField label="Patient ID" name="patientId" placeholder="e.g. PT-2026-00001" value={filters.patientId} onChange={updateFilter} />
            <FilterField label="Patient name" name="patientName" placeholder="Search patient" value={filters.patientName} onChange={updateFilter} />
            <FilterField label="Mobile number" name="mobile" placeholder="Search mobile" value={filters.mobile} onChange={updateFilter} />
            {!isDoctor && <FilterField label="Doctor" name="doctorName" placeholder="Search doctor" value={filters.doctorName} onChange={updateFilter} />}
            <FilterField label="Department" name="department" placeholder="e.g. Cardiology" value={filters.department} onChange={updateFilter} />
            <label className="field filter-field"><span>Status</span><select name="status" value={filters.status} onChange={updateFilter}><option value="">All statuses</option>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
            <FilterField label="From date" name="dateFrom" type="date" value={filters.dateFrom} onChange={updateFilter} />
            <FilterField label="To date" name="dateTo" type="date" value={filters.dateTo} onChange={updateFilter} />
            <button className="clear-filters" type="button" onClick={clearFilters}><X size={14} /> Clear filters</button>
          </div>
        )}

        <AppointmentsTable
          appointments={appointments}
          doctorsById={doctorsById}
          isDoctor={isDoctor}
          query={appointmentsQuery}
          meta={meta}
          startItem={startItem}
          endItem={endItem}
          filters={filters}
          setFilters={setFilters}
          updatePage={updatePage}
          currentPage={filters.page}
        />
      </section>
    </div>
  );
}

export default AppointmentsPage;
