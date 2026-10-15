import { Check, Search, UserRoundPlus } from 'lucide-react';

export default function BookingPatientFields({
  patientMode,
  setPatientMode,
  setFormError,
  search,
  setSearch,
  selectedPatient,
  setSelectedPatient,
  patientsQuery,
  selectPatient,
  patient,
  setPatientField,
}) {
  return (
    <>
      <div className="segmented-control">
        <button
          type="button"
          className={patientMode === 'existing' ? 'active' : ''}
          onClick={() => { setPatientMode('existing'); setFormError(''); }}
        >
          <Search size={15} /> Existing patient
        </button>
        <button
          type="button"
          className={patientMode === 'new' ? 'active' : ''}
          onClick={() => { setPatientMode('new'); setFormError(''); }}
        >
          <UserRoundPlus size={15} /> New patient
        </button>
      </div>
      {patientMode === 'existing' ? (
        <div className="field">
          <label htmlFor="patient-search">Find patient</label>
          <input
            id="patient-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSelectedPatient(null);
            }}
            placeholder="Search name, mobile, or patient ID"
            autoComplete="off"
          />
          {patientsQuery.isFetching && <small className="field-hint">Searching…</small>}
          {patientsQuery.isError && <small className="field-error">{patientsQuery.error.message}</small>}
          {patientsQuery.data?.length > 0 && !selectedPatient && (
            <div className="patient-results">
              {patientsQuery.data.map((item) => (
                <button type="button" key={item.patientId} onClick={() => selectPatient(item)}>
                  <span className="patient-avatar">{item.name.slice(0, 1).toUpperCase()}</span>
                  <span><strong>{item.name}</strong><small>{item.patientId} · {item.mobile}</small></span>
                </button>
              ))}
            </div>
          )}
          {search.trim().length >= 2 && !patientsQuery.isFetching && !patientsQuery.isError && patientsQuery.data?.length === 0 && (
            <small className="field-hint">No matching patients. Choose “New patient”.</small>
          )}
          {selectedPatient && (
            <div className="selected-patient"><Check size={14} /> Selected {selectedPatient.name}</div>
          )}
        </div>
      ) : (
        <div className="form-grid">
          <div className="field">
            <label htmlFor="patient-name">Patient name</label>
            <input id="patient-name" name="name" value={patient.name} onChange={setPatientField} required maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="patient-mobile">Mobile number</label>
            <input id="patient-mobile" name="mobile" type="tel" inputMode="tel" pattern="\+?[0-9][0-9\s()-]{5,19}" title="Enter a valid mobile number" value={patient.mobile} onChange={setPatientField} required maxLength={20} />
          </div>
          <div className="field field-wide">
            <label htmlFor="patient-email">Email <span className="optional-label">Optional</span></label>
            <input id="patient-email" name="email" type="email" value={patient.email} onChange={setPatientField} />
          </div>
        </div>
      )}
    </>
  );
}
