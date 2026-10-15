import { Check } from 'lucide-react';

export default function PatientPageHeading({ notice }) {
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">PATIENT RECORDS</div>
          <h1>Patients</h1>
          <p>Register patients independently or find an existing patient record.</p>
        </div>
      </section>
      {notice && <div className="success-banner" role="status"><Check size={16} />{notice}</div>}
    </>
  );
}
