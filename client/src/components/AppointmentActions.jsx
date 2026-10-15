import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, X } from 'lucide-react';
import { ErrorMessage } from './Feedback.jsx';
import { request } from '../api/api.js';
import { useRole } from '../hooks/useRole.js';

export default function AppointmentActions({ appointment }) {
  const queryClient = useQueryClient();
  const { can } = useRole();
  const [editing, setEditing] = useState(false);
  const [purpose, setPurpose] = useState(appointment.purpose || '');
  const [notes, setNotes] = useState(appointment.notes || '');

  const mutation = useMutation({
    mutationFn: ({ path, method, body }) => request(path, { method, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      setEditing(false);
    },
  });

  const active = ['SCHEDULED', 'ARRIVED'].includes(appointment.status);
  const canArrive = can('MARK_ARRIVED') && appointment.status === 'SCHEDULED';
  const canComplete = can('COMPLETE_APPOINTMENT') && appointment.status === 'ARRIVED';
  const doctorCanEditNotesOnly = can('UPDATE_CONSULTATION_NOTES');
  const canEdit = active && (doctorCanEditNotesOnly || can('UPDATE_APPOINTMENT'));
  const canCancel = active && can('CANCEL_APPOINTMENT');
  if (!canArrive && !canComplete && !canEdit && !canCancel) return null;

  const submitEdit = (event) => {
    event.preventDefault();
    mutation.mutate({
      path: `/appointments/${appointment.id}`,
      method: 'PATCH',
      body: doctorCanEditNotesOnly ? { notes } : { purpose, notes },
    });
  };

  const changeStatus = (action) => {
    if (action === 'cancel' && !window.confirm('Cancel this appointment?')) return;
    mutation.mutate({
      path: `/appointments/${appointment.id}/${action}`,
      method: 'POST',
    });
  };

  return (
    <>
      <div className="row-actions">
        {canArrive && <button type="button" className="row-action" onClick={() => changeStatus('arrive')}>Mark arrived</button>}
        {canComplete && <button type="button" className="row-action" onClick={() => changeStatus('complete')}>Complete</button>}
        {canEdit && <button type="button" className="row-action" aria-label={doctorCanEditNotesOnly ? 'Edit consultation notes' : 'Edit appointment'} onClick={() => { setPurpose(appointment.purpose || ''); setNotes(appointment.notes || ''); setEditing(true); }}><Pencil size={14} /></button>}
        {canCancel && <button type="button" className="row-action row-action-danger" aria-label="Cancel appointment" onClick={() => changeStatus('cancel')}><X size={15} /></button>}
      </div>
      {mutation.isError && <ErrorMessage message={mutation.error.message} />}
      {editing && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setEditing(false);
        }}>
          <form className="edit-dialog" role="dialog" aria-modal="true" aria-labelledby={`edit-title-${appointment.id}`} onSubmit={submitEdit}>
            <div className="edit-dialog-heading">
              <div><span className="eyebrow">{doctorCanEditNotesOnly ? 'CONSULTATION NOTES' : 'APPOINTMENT DETAILS'}</span><h2 id={`edit-title-${appointment.id}`}>{doctorCanEditNotesOnly ? 'Update consultation notes' : 'Update visit'}</h2></div>
              <button type="button" className="icon-button" aria-label="Close" onClick={() => setEditing(false)}><X size={17} /></button>
            </div>
            {!doctorCanEditNotesOnly && <label className="field"><span>Purpose</span><input value={purpose} maxLength={500} onChange={(event) => setPurpose(event.target.value)} /></label>}
            <label className="field"><span>Notes</span><textarea value={notes} maxLength={5000} rows={5} onChange={(event) => setNotes(event.target.value)} /></label>
            {mutation.isError && <ErrorMessage message={mutation.error.message} />}
            <div className="edit-dialog-actions">
              <button type="button" className="button button-subtle" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={mutation.isPending}>
                <Check size={15} /> {mutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
