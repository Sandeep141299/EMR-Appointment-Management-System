import { memo } from 'react';
import { Check, Clock3, LockKeyhole } from 'lucide-react';

function SlotGrid({ slots, selectedSlot, onSelect, disabled }) {
  if (!slots.length) {
    return (
      <div className="slot-empty">
        No appointments available for this date. Try another day.
      </div>
    );
  }

  return (
    <div className="slot-grid">
      {slots.map((slot) => {
        const booked = slot.status === 'booked';
        const selected = selectedSlot === slot.slotStart;
        return (
          <button
            className={`slot-card${booked ? ' is-booked' : ''}${selected ? ' is-selected' : ''}`}
            type="button"
            key={slot.slotStart}
            disabled={booked || disabled}
            onClick={() => onSelect(slot.slotStart)}
            aria-pressed={selected}
            aria-label={`${slot.slotStart}, ${booked ? 'booked' : 'available'}`}
          >
            <span className="slot-time"><Clock3 size={14} />{slot.slotStart}</span>
            <span className="slot-state">
              {booked ? <><LockKeyhole size={12} /> Booked</> : selected ? <><Check size={12} /> Selected</> : 'Available'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default memo(SlotGrid);
