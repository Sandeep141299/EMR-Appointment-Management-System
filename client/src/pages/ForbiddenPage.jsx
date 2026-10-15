import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <main className="forbidden-page">
      <div className="forbidden-card">
        <span className="eyebrow">403 · ACCESS DENIED</span>
        <h1>You don’t have permission to view this page.</h1>
        <p>If you need access, contact your clinic administrator.</p>
        <Link className="button button-primary" to="/">Return to dashboard</Link>
      </div>
    </main>
  );
}
