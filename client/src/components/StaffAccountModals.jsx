import { UsersRound } from 'lucide-react';
import { ROLES } from '../config/roleConfig.js';
import FormField from './FormField.jsx';
import Modal from './Modal.jsx';
import { ErrorMessage } from './Feedback.jsx';

export default function StaffAccountModals({
  create,
  editingStaff,
  editForm,
  setEditForm,
  updateMutation,
  onCloseEdit,
  onSubmitEdit,
  form,
  createMutation,
  updateForm,
  onSubmitCreate,
  onCloseCreate,
}) {
  return (
    <>
      {create && (
        <Modal title="Create staff account" onClose={onCloseCreate}>
          <form className="admin-create-form" onSubmit={onSubmitCreate}>
            <FormField label="Role">
              <select name="role" value={form.role} onChange={updateForm}>
                <option value="DOCTOR">Doctor</option>
                <option value="RECEPTIONIST">Receptionist</option>
              </select>
            </FormField>
            <FormField label="Full name" name="name" value={form.name} onChange={updateForm} autoComplete="name" maxLength={120} required />
            <FormField label="Email address" type="email" name="email" value={form.email} onChange={updateForm} autoComplete="email" maxLength={254} required />
            <FormField label="Password" type="password" name="password" value={form.password} onChange={updateForm} autoComplete="new-password" minLength={8} maxLength={8} hint="Use at least 8 characters." required />
            <FormField
              label={form.role === ROLES.DOCTOR ? 'Department' : 'Department (optional)'}
              name="department"
              value={form.department}
              onChange={updateForm}
              maxLength={120}
              required={form.role === ROLES.DOCTOR}
              placeholder="e.g. Cardiology"
            />
            {createMutation.isError && <ErrorMessage message={createMutation.error.message} />}
            <div className="admin-modal-actions">
              <button className="button button-subtle" type="button" onClick={onCloseCreate}>Cancel</button>
              <button className="button button-primary" type="submit" disabled={createMutation.isPending}>
                <UsersRound size={15} /> {createMutation.isPending ? 'Creating…' : 'Create account'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {editingStaff && (
        <Modal title={`Edit ${editingStaff.role === ROLES.DOCTOR ? 'doctor' : 'receptionist'}`} onClose={onCloseEdit}>
          <form className="admin-create-form" onSubmit={onSubmitEdit}>
            <FormField label="Full name" name="name" value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} maxLength={120} required />
            <FormField label="Email address" type="email" name="email" value={editForm.email} onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))} maxLength={254} required />
            <FormField
              label={editingStaff.role === ROLES.DOCTOR ? 'Department' : 'Department (optional)'}
              name="department"
              value={editForm.department}
              onChange={(event) => setEditForm((current) => ({ ...current, department: event.target.value }))}
              maxLength={120}
              required={editingStaff.role === ROLES.DOCTOR}
            />
            <FormField label="Account status">
              <select
                value={editForm.isActive ? 'active' : 'inactive'}
                onChange={(event) => setEditForm((current) => ({ ...current, isActive: event.target.value === 'active' }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
            {updateMutation.isError && <ErrorMessage message={updateMutation.error.message} />}
            <div className="admin-modal-actions">
              <button className="button button-subtle" type="button" onClick={onCloseEdit}>Cancel</button>
              <button className="button button-primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
