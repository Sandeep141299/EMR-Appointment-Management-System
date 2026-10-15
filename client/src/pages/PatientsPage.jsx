import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PatientDirectory from '../components/PatientDirectory.jsx';
import PatientEditModal from '../components/PatientEditModal.jsx';
import PatientPageHeading from '../components/PatientPageHeading.jsx';
import { request } from '../api/api.js';
import usePatientDirectoryState from '../hooks/usePatientDirectoryState.js';

const EMPTY_PATIENT = {
  name: '',
  mobile: '',
  email: '',
  dateOfBirth: '',
  gender: 'PREFER_NOT_TO_SAY',
  address: '',
  emergencyContact: { name: '', mobile: '', relationship: '' },
};

function PatientsPage() {
  const queryClient = useQueryClient();
  const { search, setSearch, page, setPage, sort, changeSort } = usePatientDirectoryState();
  const [form, setForm] = useState(EMPTY_PATIENT);
  const [patientToEdit, setPatientToEdit] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_PATIENT);
  const [notice, setNotice] = useState('');
  const patientQuery = useQuery({
    queryKey: ['patients-directory', search, page, sort],
    queryFn: () => request('/patients', {
      query: { search: search.trim(), page, pageSize: 10, ...sort },
    }),
    placeholderData: (previousData) => previousData,
  });
  const createPatient = useMutation({
    mutationFn: (input) => request('/patients', { method: 'POST', body: input }),
    onSuccess: (result) => {
      const created = result.data;
      setForm(EMPTY_PATIENT);
      setSearch('');
      setPage(1);
      setNotice(`Patient ${created.patientId} created successfully.`);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-directory'] });
    },
  });
  const updatePatient = useMutation({
    mutationFn: ({ id, input }) => request(`/patients/${id}`, {
      method: 'PATCH',
      body: input,
    }),
    onSuccess: (result) => {
      setPatientToEdit(null);
      setNotice(`Patient ${result.data.patientId} updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-directory'] });
    },
  });

  const updateForm = (event) => {
    setNotice('');
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitPatient = (event) => {
    event.preventDefault();
    createPatient.mutate({
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
      gender: form.gender,
      ...(form.address.trim() ? { address: form.address.trim() } : {}),
    });
  };

  const openPatientEditor = (patient) => {
    setPatientToEdit(patient);
    setEditForm({
      ...EMPTY_PATIENT,
      ...patient,
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '',
      emergencyContact: {
        ...EMPTY_PATIENT.emergencyContact,
        ...patient.emergencyContact,
      },
    });
    updatePatient.reset();
  };

  const submitPatientUpdate = (event) => {
    event.preventDefault();
    updatePatient.mutate({
      id: patientToEdit.id,
      input: {
        name: editForm.name.trim(),
        mobile: editForm.mobile.trim(),
        email: editForm.email.trim() || null,
        dateOfBirth: editForm.dateOfBirth || null,
        gender: editForm.gender,
        address: editForm.address.trim(),
        emergencyContact: {
          name: editForm.emergencyContact.name.trim(),
          mobile: editForm.emergencyContact.mobile.trim(),
          relationship: editForm.emergencyContact.relationship.trim(),
        },
      },
    });
  };

  const updateEditForm = (event) => {
    const { name, value } = event.target;
    if (name.startsWith('emergencyContact.')) {
      const field = name.slice('emergencyContact.'.length);
      setEditForm((current) => ({
        ...current,
        emergencyContact: { ...current.emergencyContact, [field]: value },
      }));
      return;
    }
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const result = patientQuery.data;
  const patients = result?.data || [];
  const meta = result?.meta;
  return (
    <div className="page-stack">
      <PatientPageHeading notice={notice} />

      <PatientDirectory
        form={form}
        updateForm={updateForm}
        submitPatient={submitPatient}
        createPatient={createPatient}
        search={search}
        setSearch={setSearch}
        setPage={setPage}
        patientQuery={patientQuery}
        patients={patients}
        meta={meta}
        sort={sort}
        changeSort={changeSort}
        openPatientEditor={openPatientEditor}
      />
      <PatientEditModal
        patient={patientToEdit}
        setPatient={setPatientToEdit}
        form={editForm}
        updateForm={updateEditForm}
        mutation={updatePatient}
        onSubmit={submitPatientUpdate}
      />
    </div>
  );
}

export default PatientsPage;
