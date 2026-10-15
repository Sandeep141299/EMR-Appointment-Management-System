import { CalendarDays, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { startOfToday, toLocalDateString } from '../utils/date.js';
import { ErrorMessage } from './Feedback.jsx';

export default function SchedulerFilters({
  department,
  changeDepartment,
  departments,
  doctorSelectRef,
  selectedDoctor,
  changeDoctor,
  doctors,
  doctorsQuery,
  date,
  updateDate,
}) {
  return (
    <section className="filter-panel">
      <div className="filter-panel-title"><SlidersHorizontal size={16} /><span>Find an appointment</span><span className="filter-title-rule" /></div>
      <div className="scheduler-filters">
        <label className="field">
          <span>Department</span>
          <span className="select-wrap"><select value={department} onChange={(event) => changeDepartment(event.target.value)}>
            <option value="">All departments</option>
            {departments.map((name) => <option key={name} value={name}>{name}</option>)}
          </select><ChevronDown size={15} /></span>
        </label>
        <label className="field">
          <span>Doctor</span>
          <span className="select-wrap"><select ref={doctorSelectRef} value={selectedDoctor} onChange={(event) => changeDoctor(event.target.value)} disabled={doctorsQuery.isLoading}>
            <option value="">Choose a doctor</option>
            {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} · {doctor.department}</option>)}
          </select><ChevronDown size={15} /></span>
        </label>
        <label className="field">
          <span>Appointment date</span>
          <span className="date-input-wrap"><CalendarDays size={16} /><input type="date" value={date} min={toLocalDateString(startOfToday())} onChange={(event) => updateDate(event.target.value)} /></span>
        </label>
      </div>
      {doctorsQuery.isError && <ErrorMessage message={doctorsQuery.error.message} onRetry={doctorsQuery.refetch} />}
      {!doctorsQuery.isLoading && doctors.length === 0 && !doctorsQuery.isError && (
        <p className="inline-note">No active doctors found{department ? ` in ${department}` : ''}.</p>
      )}
    </section>
  );
}
