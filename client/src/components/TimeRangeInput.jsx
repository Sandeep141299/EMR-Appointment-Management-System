import FormField from './FormField.jsx';

export default function TimeRangeInput({
  label,
  startTime,
  endTime,
  onChange,
  error,
}) {
  return (
    <fieldset className="time-range-input">
      <legend>{label}</legend>
      <FormField
        label="Start time"
        type="time"
        value={startTime}
        onChange={(event) => onChange('startTime', event.target.value)}
        error={error?.startTime}
        required
      />
      <span className="time-range-separator">to</span>
      <FormField
        label="End time"
        type="time"
        value={endTime}
        onChange={(event) => onChange('endTime', event.target.value)}
        error={error?.endTime}
        required
      />
    </fieldset>
  );
}
