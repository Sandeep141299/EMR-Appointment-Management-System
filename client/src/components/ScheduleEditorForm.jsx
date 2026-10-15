import { Check, Clock3, Save } from 'lucide-react';
import { EmptyState, ErrorMessage, Spinner } from './Feedback.jsx';
import FormField from './FormField.jsx';
import SchedulePeriods from './SchedulePeriods.jsx';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_DURATIONS = [10, 15, 20, 30];

export default function ScheduleEditorForm({
  doctorId,
  setDoctorId,
  doctors,
  doctorsQuery,
  scheduleQuery,
  selectedDoctor,
  schedule,
  validationErrors,
  sessionsInvalid,
  breaksInvalid,
  saveMutation,
  saved,
  saveSchedule,
  toggleWorkingDay,
  changeSlotDuration,
  updatePeriodName,
  updatePeriodTime,
  removePeriod,
  addPeriod,
}) {
  return (
    <section className="staff-card schedule-builder-card">
      <div className="staff-card-heading">
        <span className="staff-card-icon"><Clock3 size={18} /></span>
        <span><strong>Weekly availability</strong><small>Choose a doctor and configure their schedule.</small></span>
      </div>
      <FormField label="Doctor">
        <select value={doctorId} onChange={(event) => setDoctorId(event.target.value)} disabled={doctorsQuery.isLoading}>
          <option value="">Choose a doctor</option>
          {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} · {doctor.department}</option>)}
        </select>
      </FormField>
      {doctorsQuery.isLoading && <Spinner label="Loading doctors" />}
      {doctorsQuery.isError && <ErrorMessage message={doctorsQuery.error.message} onRetry={doctorsQuery.refetch} />}
      {!doctorsQuery.isLoading && !doctorsQuery.isError && doctors.length === 0 && (
        <EmptyState title="No doctors to schedule" description="Create a doctor account before adding weekly availability." />
      )}
      {doctorId && scheduleQuery.isLoading && <Spinner label="Loading saved schedule" />}
      {doctorId && scheduleQuery.isError && <ErrorMessage message={scheduleQuery.error.message} onRetry={scheduleQuery.refetch} />}
      {scheduleQuery.data?.requiresReconfiguration && (
        <ErrorMessage message="This schedule uses an older format. Saving the values below will replace it with the current schedule format." />
      )}
      {doctorId && !scheduleQuery.isLoading && !scheduleQuery.isError && (
        <form className="schedule-form" onSubmit={saveSchedule}>
          {selectedDoctor && (
            <div className="selected-doctor-chip">
              <span className="provider-avatar"><Clock3 size={16} /></span>
              <span><strong>{selectedDoctor.name}</strong><small>{selectedDoctor.department}</small></span>
            </div>
          )}
          <fieldset className="schedule-days-field">
            <legend>Working days</legend>
            <div className="weekday-picker">
              {DAYS.map((day, index) => (
                <label className={`weekday-chip${schedule.workingDays.includes(index) ? ' selected' : ''}`} key={day}>
                  <input type="checkbox" checked={schedule.workingDays.includes(index)} onChange={() => toggleWorkingDay(index)} />
                  {day.slice(0, 3)}
                </label>
              ))}
            </div>
            {validationErrors.workingDays && <small className="field-error">{validationErrors.workingDays}</small>}
          </fieldset>
          <FormField label="Slot duration">
            <select value={schedule.slotDuration} onChange={changeSlotDuration}>
              {SLOT_DURATIONS.map((duration) => <option key={duration} value={duration}>{duration} minutes</option>)}
            </select>
            {validationErrors.slotDuration && <small className="field-error">{validationErrors.slotDuration}</small>}
          </FormField>
          <SchedulePeriods
            type="sessions"
            periods={schedule.sessions}
            errors={validationErrors}
            invalid={sessionsInvalid}
            updateName={updatePeriodName}
            updateTime={updatePeriodTime}
            removePeriod={removePeriod}
            addPeriod={addPeriod}
          />
          <SchedulePeriods
            type="breaks"
            periods={schedule.breaks}
            errors={validationErrors}
            invalid={breaksInvalid}
            updateName={updatePeriodName}
            updateTime={updatePeriodTime}
            removePeriod={removePeriod}
            addPeriod={addPeriod}
          />
          {saveMutation.isError && <ErrorMessage message={saveMutation.error.message} />}
          {saved && <div className="success-banner" role="status"><Check size={15} /> Schedule saved.</div>}
          <button className="button button-primary staff-submit" type="submit" disabled={saveMutation.isPending || !schedule.workingDays.length}>
            <Save size={15} /> {saveMutation.isPending ? 'Saving schedule…' : 'Save schedule'}
          </button>
        </form>
      )}
    </section>
  );
}
