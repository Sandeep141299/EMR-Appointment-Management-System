import { CalendarDays, Clock3, Sparkles } from 'lucide-react';

export default function SchedulerAside({ canBook }) {
  return (
    <aside className="scheduler-aside">
      <div className="aside-icon"><Sparkles size={19} /></div>
      <h3>A smoother day<br />starts here.</h3>
      <p>Choose a time to reserve a visit. The schedule updates live as your team books appointments.</p>
      <div className="aside-rule" />
      <div className="aside-detail"><span className="aside-detail-icon"><CalendarDays size={15} /></span><span><strong>Always up to date</strong><small>Availability refreshes in real time</small></span></div>
      <div className="aside-detail"><span className="aside-detail-icon"><Clock3 size={15} /></span><span><strong>Clinic local time</strong><small>Times shown for your location</small></span></div>
      {!canBook && <div className="inline-note">Your account can view availability but cannot create bookings.</div>}
    </aside>
  );
}
