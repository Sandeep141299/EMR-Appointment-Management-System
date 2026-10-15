import { Plus, Trash2 } from 'lucide-react';
import FormField from './FormField.jsx';
import TimeRangeInput from './TimeRangeInput.jsx';

export default function SchedulePeriods({
  type,
  periods,
  errors,
  invalid,
  updateName,
  updateTime,
  removePeriod,
  addPeriod,
}) {
  const isSession = type === 'sessions';
  const label = isSession ? 'Session' : 'Break';
  const description = isSession ? 'Overlapping time ranges are not allowed.' : 'Breaks are excluded from generated slots.';
  const invalidMessage = isSession
    ? 'Review session time ranges; each end must follow its start and sessions cannot overlap.'
    : 'Review break time ranges; each end must follow its start and breaks cannot overlap.';

  return (
    <section className="schedule-period-section">
      <div className="schedule-section-heading"><span><strong>{isSession ? 'Sessions' : 'Breaks'}</strong><small>{description}</small></span></div>
      {periods.map((period, index) => (
        <article className="schedule-period-card" key={`${isSession ? 'session' : 'break'}-${index}`}>
          <div className="schedule-period-top">
            <FormField
              label={`${label} ${index + 1} name`}
              value={period.name}
              maxLength={80}
              onChange={(event) => updateName(type, index, event.target.value)}
              error={errors[`${type}.${index}.name`]}
              required
            />
            {(!isSession || periods.length > 1) && (
              <button
                className="icon-button small-icon-button"
                type="button"
                aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
                onClick={() => removePeriod(type, index)}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <TimeRangeInput
            label={`${label} ${index + 1} hours`}
            startTime={period.startTime}
            endTime={period.endTime}
            onChange={(key, value) => updateTime(type, index, key, value)}
            error={{
              startTime: errors[`${type}.${index}.startTime`],
              endTime: errors[`${type}.${index}.endTime`],
            }}
          />
        </article>
      ))}
      {invalid && <small className="field-error">{invalidMessage}</small>}
      <button className="add-session-button" type="button" onClick={() => addPeriod(type)}>
        <Plus size={14} /> Add {label.toLowerCase()}
      </button>
    </section>
  );
}
