import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { request } from '../api/api.js';
import { ErrorMessage } from './Feedback.jsx';
import BookingPatientFields from './BookingPatientFields.jsx';

export default function BookingForm({ doctorId, date, slotStart, initialPatient = null, onBooked }) {
  const [patientMode, setPatientMode] = useState('existing');
  const [search, setSearch] = useState(initialPatient ? `${initialPatient.name} · ${initialPatient.patientId}` : '');
  const [selectedPatient, setSelectedPatient] = useState(initialPatient);
  const [formError, setFormError] = useState('');
  const [patient, setPatient] = useState({ name: '', mobile: '', email: '' });
  const [details, setDetails] = useState({ purpose: '', notes: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const patientsQuery = useQuery({
    queryKey: ['patients', debouncedSearch],
    queryFn: async () => (await request('/patients', { query: { search: debouncedSearch } })).data,
    enabled: patientMode === 'existing' && !selectedPatient && debouncedSearch.trim().length >= 2,
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!initialPatient) return;
    setSelectedPatient(initialPatient);
    setSearch(`${initialPatient.name} · ${initialPatient.patientId}`);
  }, [initialPatient]);

  const mutation = useMutation({
    mutationFn: (body) => request('/appointments', { method: 'POST', body }),
    onSuccess: () => {
      setSearch('');
      setSelectedPatient(null);
      setPatient({ name: '', mobile: '', email: '' });
      setDetails({ purpose: '', notes: '' });
      setFormError('');
      onBooked();
    },
    onError: (error) => setFormError(error.message),
  });

  const selectPatient = useCallback((value) => {
    setSelectedPatient(value);
    setSearch(`${value.name} · ${value.patientId}`);
  }, []);

  const setPatientField = (event) => {
    setPatient((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const setDetailField = (event) => {
    setDetails((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    setFormError('');
    if (patientMode === 'existing' && !selectedPatient) {
      setFormError('Search for and select a patient first.');
      return;
    }
    if (patientMode === 'new') {
      if (!patient.name.trim()) {
        setFormError('Enter the patient’s name.');
        return;
      }
      if (!/^\+?[0-9][0-9\s()-]{5,19}$/.test(patient.mobile.trim())) {
        setFormError('Enter a valid mobile number.');
        return;
      }
    }
    mutation.mutate({
      doctorId,
      date,
      slotStart,
      ...details,
      ...(patientMode === 'existing'
        ? { patientId: selectedPatient.patientId }
        : { patient: { ...patient, ...(patient.email.trim() ? {} : { email: undefined }) } }),
    });
  };

  return (
    <form className="booking-form" onSubmit={submit}>
      <div className="form-heading">
        <div className="form-heading-icon"><Check size={17} /></div>
        <div>
          <h3>Complete booking</h3>
          <p>{date} <span>·</span> {slotStart}</p>
        </div>
      </div>

      <BookingPatientFields
        patientMode={patientMode}
        setPatientMode={setPatientMode}
        setFormError={setFormError}
        search={search}
        setSearch={setSearch}
        selectedPatient={selectedPatient}
        setSelectedPatient={setSelectedPatient}
        patientsQuery={patientsQuery}
        selectPatient={selectPatient}
        patient={patient}
        setPatientField={setPatientField}
      />

      <div className="field">
        <label htmlFor="appointment-purpose">Visit purpose <span className="optional-label">Optional</span></label>
        <input id="appointment-purpose" name="purpose" value={details.purpose} onChange={setDetailField} maxLength={500} placeholder="e.g. Annual check-up" />
      </div>
      <div className="field">
        <label htmlFor="appointment-notes">Notes <span className="optional-label">Optional</span></label>
        <textarea id="appointment-notes" name="notes" value={details.notes} onChange={setDetailField} maxLength={5000} rows={2} placeholder="Add a note for the care team" />
      </div>
      {formError && <ErrorMessage message={formError} />}
      <button className="button button-primary booking-submit" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Booking appointment…' : 'Confirm appointment'}
      </button>
    </form>
  );
}
