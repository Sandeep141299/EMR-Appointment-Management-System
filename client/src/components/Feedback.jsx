import { AlertCircle, LoaderCircle } from 'lucide-react';

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="feedback-state" role="status">
      <LoaderCircle className="spin" size={20} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={20} />
      <span>{message || 'Something went wrong. Please try again.'}</span>
      {onRetry && <button className="text-button" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><AlertCircle size={20} /></span>
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}
