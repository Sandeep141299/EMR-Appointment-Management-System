import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { EmptyState, ErrorMessage, Spinner } from '../components/Feedback.jsx';
import { request } from '../api/api.js';

const PAGE_SIZE = 25;

function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const logsQuery = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: async () => request('/admin/audit-logs', {
      query: { page, pageSize: PAGE_SIZE },
    }),
    placeholderData: (previousData) => previousData,
  });
  const logs = logsQuery.data?.data || [];
  const meta = logsQuery.data?.meta;
  const startItem = meta?.total ? (meta.page - 1) * meta.pageSize + 1 : 0;
  const endItem = Math.min(meta?.page * meta?.pageSize || 0, meta?.total || 0);

  return (
    <div className="page-stack">
      <section className="page-heading audit-logs-heading">
        <div>
          <div className="eyebrow">SYSTEM ACTIVITY</div>
          <h1>Audit logs</h1>
          <p>Review staff and system activity across the clinic.</p>
        </div>
        <div className="appointments-count">
          <span className="count-icon"><ClipboardList size={17} /></span>
          <span><strong>{meta?.total ?? '—'}</strong><small>Total events</small></span>
        </div>
      </section>

      <section className="list-card audit-logs-card">
        <div className="list-toolbar">
          <div className="list-toolbar-title">
            <span className="toolbar-icon"><ClipboardList size={17} /></span>
            <span><strong>Activity history</strong><small>Newest events appear first</small></span>
          </div>
        </div>
        <div className="table-overflow">
          <table className="appointments-table audit-logs-table">
            <thead>
              <tr>
                <th>Date &amp; time</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Outcome</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="audit-date">{formatDateTime(log.createdAt)}</td>
                  <td>
                    <span className="audit-actor">{log.actor?.name || log.actor?.email || 'System / unknown'}</span>
                    {log.actor?.name && log.actor?.email && <small className="table-secondary">{log.actor.email}</small>}
                  </td>
                  <td>{log.role || '—'}</td>
                  <td><span className="audit-action">{log.action}</span></td>
                  <td><span className={`status-badge status-${log.outcome?.toLowerCase()}`}>{log.outcome?.toLowerCase() || 'unknown'}</span></td>
                  <td>
                    <span>{log.targetType || '—'}</span>
                    {log.targetId && <small className="table-secondary audit-target-id">{log.targetId}</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logsQuery.isLoading && <Spinner label="Loading audit logs" />}
          {logsQuery.isError && <ErrorMessage message={logsQuery.error.message} onRetry={logsQuery.refetch} />}
          {!logsQuery.isLoading && !logsQuery.isError && logs.length === 0 && (
            <EmptyState title="No audit logs yet" description="System activity will appear here as it is recorded." />
          )}
        </div>
        <div className="table-footer">
          <span>Showing <strong>{startItem}–{endItem}</strong> of <strong>{meta?.total ?? 0}</strong> events</span>
          <div className="pagination">
            <button
              type="button"
              className="icon-button"
              aria-label="Previous page"
              disabled={!meta?.hasPreviousPage || logsQuery.isFetching}
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <span>Page <strong>{meta?.page || 1}</strong> of <strong>{meta?.totalPages || 1}</strong></span>
            <button
              type="button"
              className="icon-button"
              aria-label="Next page"
              disabled={!meta?.hasNextPage || logsQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AuditLogsPage;
