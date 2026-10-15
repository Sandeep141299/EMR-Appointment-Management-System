import { Check } from 'lucide-react';
import Modal from './Modal.jsx';
import { ErrorMessage } from './Feedback.jsx';

export default function PatientEditModal({
  patient,
  setPatient,
  form,
  updateForm,
  mutation,
  onSubmit,
}) {
  if (!patient) return null;
  return (
    <Modal title={`Edit patient ${patient.patientId}`} onClose={() => setPatient(null)}>
      <form className="staff-form" onSubmit={onSubmit}>
        <label className="field">Full name<input name="name" value={form.name} onChange={updateForm} maxLength={120} required /></label>
        <label className="field">Mobile number<input name="mobile" type="tel" value={form.mobile} onChange={updateForm} maxLength={20} required /></label>
        <label className="field">Email address<input name="email" type="email" value={form.email || ''} onChange={updateForm} maxLength={254} /></label>
        <label className="field">Date of birth<input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateForm} /></label>
        <label className="field">Gender<select name="gender" value={form.gender} onChange={updateForm}>
          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          <option value="FEMALE">Female</option>
          <option value="MALE">Male</option>
          <option value="NON_BINARY">Non-binary</option>
          <option value="OTHER">Other</option>
        </select></label>
        <label className="field">Address<textarea name="address" value={form.address} onChange={updateForm} maxLength={500} rows={3} /></label>
        <h3>Emergency contact</h3>
        <label className="field">Contact name<input name="emergencyContact.name" value={form.emergencyContact.name} onChange={updateForm} maxLength={120} /></label>
        <label className="field">Contact mobile<input name="emergencyContact.mobile" type="tel" value={form.emergencyContact.mobile} onChange={updateForm} maxLength={20} /></label>
        <label className="field">Relationship<input name="emergencyContact.relationship" value={form.emergencyContact.relationship} onChange={updateForm} maxLength={60} /></label>
        {mutation.isError && <ErrorMessage message={mutation.error.message} />}
        <button className="button button-primary" type="submit" disabled={mutation.isPending}>
          <Check size={15} /> {mutation.isPending ? 'Saving patient…' : 'Save patient'}
        </button>
      </form>
    </Modal>
  );
}
