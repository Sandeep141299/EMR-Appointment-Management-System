import { CalendarDays } from 'lucide-react';
import { EmptyState, ErrorMessage, Spinner } from './Feedback.jsx';
import FormField from './FormField.jsx';
import { toLocalDateString } from '../utils/date.js';

export default function ScheduleSlotPreview({
  doctorId,
  selectedDate,
  setSelectedDate,
  slotsQuery,
  slots,
  slotSummary,
}) {
  return (
    <section className="list-card slot-preview-card">
      <div className="list-toolbar">
        <div className="staff-card-heading">
          <span className="staff-card-icon"><CalendarDays size={18} /></span>
          <span><strong>Live slot preview</strong><small>Current saved availability from the slots API.</small></span>
        </div>
      </div>
      <div className="slot-preview-controls">
        <FormField
          label="Preview date"
          type="date"
          value={selectedDate}
          min={toLocalDateString(new Date())}
          onChange={(event) => setSelectedDate(event.target.value)}
        />
      </div>
      {!doctorId ? (
        <EmptyState title="Select a doctor" description="Choose a doctor to preview slots for a date." />
      ) : slotsQuery.isLoading ? (
        <Spinner label="Loading live slots" />
      ) : slotsQuery.isError ? (
        <ErrorMessage message={slotsQuery.error.message} onRetry={slotsQuery.refetch} />
      ) : slots.length === 0 ? (
        <EmptyState title="No slots available" description="There are no upcoming slots for this doctor on the selected date." />
      ) : (
        <>
          <div className="slot-preview-summary">
            <span><i className="legend-dot available-dot" /> {slotSummary.available} available</span>
            <span><i className="legend-dot booked-dot" /> {slotSummary.booked} booked</span>
          </div>
          <div className="slot-preview-grid">
            {slots.map((slot) => (
              <div className={`slot-preview-item${slot.status === 'booked' ? ' booked' : ''}`} key={slot.slotStart}>
                <strong>{slot.slotStart}</strong><span>{slot.status === 'booked' ? 'Booked' : 'Available'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
