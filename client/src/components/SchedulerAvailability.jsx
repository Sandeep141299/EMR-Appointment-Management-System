import { ArrowLeft, ArrowRight, Clock3, Stethoscope } from 'lucide-react';
import { EmptyState, ErrorMessage, Spinner } from './Feedback.jsx';
import SlotGrid from './SlotGrid.jsx';
import { startOfToday, toLocalDateString } from '../utils/date.js';

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function SchedulerAvailability({
  currentDate,
  isToday,
  shiftDate,
  updateDate,
  selectedDoctor,
  selectedDoctorDetails,
  slotsQuery,
  selectedSlot,
  setSelectedSlot,
  canBook,
}) {
  return (
    <section className="schedule-panel">
      <div className="schedule-panel-top">
        <div>
          <div className="eyebrow">AVAILABLE TIMES</div>
          <h2>{formatDate(currentDate)}</h2>
          <p>Select a slot to continue with booking.</p>
        </div>
        <div className="date-stepper">
          <button type="button" className="icon-button" onClick={() => shiftDate(-1)} aria-label="Previous day" disabled={isToday}><ArrowLeft size={17} /></button>
          <button type="button" className="today-button" onClick={() => updateDate(toLocalDateString(startOfToday()))}>Today</button>
          <button type="button" className="icon-button" onClick={() => shiftDate(1)} aria-label="Next day"><ArrowRight size={17} /></button>
        </div>
      </div>
      <div className="schedule-provider">
        <span className="provider-avatar"><Stethoscope size={17} /></span>
        <span><strong>{selectedDoctorDetails?.name || 'Select a doctor'}</strong><small>{selectedDoctorDetails?.department || 'Choose a provider to view availability'}</small></span>
        <span className="timezone-note"><Clock3 size={13} /> Clinic local time</span>
      </div>
      {!selectedDoctor ? (
        <EmptyState title="Choose a provider" description="Select a department and doctor to see available appointment times." />
      ) : slotsQuery.isLoading ? (
        <Spinner label="Checking availability" />
      ) : slotsQuery.isError ? (
        <ErrorMessage message={slotsQuery.error.message} onRetry={slotsQuery.refetch} />
      ) : slotsQuery.data?.length ? (
        <SlotGrid slots={slotsQuery.data} selectedSlot={selectedSlot} onSelect={setSelectedSlot} disabled={!canBook} />
      ) : (
        <EmptyState title="No times available" description="There are no upcoming slots for this doctor on the selected date." />
      )}
      <div className="slot-legend">
        <span><i className="legend-dot available-dot" /> Available</span>
        <span><i className="legend-dot booked-dot" /> Booked</span>
      </div>
    </section>
  );
}
