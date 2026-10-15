import { ErrorMessage, Spinner } from './Feedback.jsx';

export default function BookingPatientBanner({ query }) {
  return (
    <section className="booking-patient-banner" aria-live="polite">
      {query.isLoading ? (
        <Spinner label="Loading selected patient" />
      ) : query.isError ? (
        <ErrorMessage message={query.error.message} onRetry={query.refetch} />
      ) : query.data ? (
        <>
          <span className="patient-avatar">{query.data.name.slice(0, 1).toUpperCase()}</span>
          <span><strong>Booking for {query.data.name}</strong><small>{query.data.patientId} · {query.data.mobile}</small></span>
          <span className="booking-instructions">Choose a doctor, date, and available time to continue.</span>
        </>
      ) : (
        <ErrorMessage message="The selected patient could not be found. Choose another patient or open the Patients page to select a different record." />
      )}
    </section>
  );
}
