import { Pencil, Plus } from 'lucide-react';
import { ROLES } from '../config/roleConfig.js';
import { EmptyState, ErrorMessage, Spinner } from './Feedback.jsx';

export default function StaffDirectorySection({ directories, onAdd, onEdit }) {
  return directories.map(({ role, title, description, icon: Icon, query }) => {
    const staff = query.data || [];
    return (
      <section className="list-card admin-doctors-card" key={role}>
        <div className="list-toolbar">
          <div className="staff-card-heading">
            <span className="staff-card-icon"><Icon size={18} /></span>
            <span><strong>{title}</strong><small>{description}</small></span>
          </div>
          <div className="staff-directory-actions">
            <span className="staff-directory-count">{staff.length} {staff.length === 1 ? 'account' : 'accounts'}</span>
            <button className="button button-subtle" type="button" onClick={() => onAdd(role)}>
              <Plus size={15} /> Add {role === ROLES.DOCTOR ? 'doctor' : 'receptionist'}
            </button>
          </div>
        </div>
        {query.isLoading && <Spinner label={`Loading ${title.toLowerCase()}`} />}
        {query.isError && <ErrorMessage message={query.error.message} onRetry={query.refetch} />}
        {!query.isLoading && !query.isError && staff.length === 0 && (
          <EmptyState
            title={`No ${title.toLowerCase()} yet`}
            description={role === ROLES.DOCTOR ? 'Add a doctor to configure schedules and book visits.' : 'Add a receptionist to see their account here.'}
          />
        )}
        {staff.length > 0 && (
          <div className="admin-doctor-grid">
            {staff.map((user) => (
              <article className="admin-doctor-card" key={user.id}>
                <span className="admin-doctor-avatar"><Icon size={18} /></span>
                <div className="admin-doctor-info">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  {user.department && <span>{user.department}</span>}
                </div>
                <span className={`admin-doctor-status${user.isActive ? '' : ' is-inactive'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
                <button type="button" className="button button-subtle" aria-label={`Edit ${user.name}`} onClick={() => onEdit(user)}>
                  <Pencil size={14} /> Edit
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  });
}
