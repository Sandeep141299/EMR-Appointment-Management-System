import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Stethoscope, UsersRound } from 'lucide-react';
import StaffAccountModals from '../components/StaffAccountModals.jsx';
import StaffDirectorySection from '../components/StaffDirectorySection.jsx';
import { ROLES } from '../config/roleConfig.js';
import { request } from '../api/api.js';

const emptyForm = { role: ROLES.DOCTOR, name: '', email: '', password: '', department: '' };

export default function DoctorsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', department: '', isActive: true });
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState('');
  const doctorsQuery = useQuery({
    queryKey: ['staff', ROLES.DOCTOR],
    queryFn: async () => (await request('/admin/users', { query: { role: ROLES.DOCTOR } })).data,
  });
  const receptionistsQuery = useQuery({
    queryKey: ['staff', ROLES.RECEPTIONIST],
    queryFn: async () => (await request('/admin/users', { query: { role: ROLES.RECEPTIONIST } })).data,
  });
  const createMutation = useMutation({
    mutationFn: ({ role, ...body }) => request(
      `/admin/${role === ROLES.DOCTOR ? 'doctors' : 'receptionists'}`,
      { method: 'POST', body },
    ),
    onSuccess: (result) => {
      setForm({
        ...emptyForm,
      });
      setModalOpen(false);
      setNotice(result.message || 'Staff account created successfully.');
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => request(`/admin/users/${id}`, {
      method: 'PATCH',
      body,
    }),
    onSuccess: (result) => {
      setEditingStaff(null);
      setNotice(`${result.data.role === ROLES.DOCTOR ? 'Doctor' : 'Receptionist'} updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule'] });
    },
  });
  const directories = [
    {
      role: ROLES.DOCTOR,
      title: 'Doctors',
      description: 'Manage doctor profiles, departments, and account status.',
      icon: Stethoscope,
      query: doctorsQuery,
    },
    {
      role: ROLES.RECEPTIONIST,
      title: 'Receptionists',
      description: 'Manage receptionist accounts and account status.',
      icon: UsersRound,
      query: receptionistsQuery,
    },
  ];
  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };
  const openEdit = (user) => {
    setEditingStaff(user);
    setEditForm({
      name: user.name,
      email: user.email,
      department: user.department || '',
      isActive: user.isActive,
    });
    updateMutation.reset();
  };
  const submitEdit = (event) => {
    event.preventDefault();
    updateMutation.mutate({
      id: editingStaff.id,
      body: {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        department: editForm.department.trim(),
        isActive: editForm.isActive,
      },
    });
  };
  const openCreate = (role = emptyForm.role) => {
    createMutation.reset();
    setForm({ ...emptyForm, role });
    setModalOpen(true);
  };
  const closeCreate = () => {
    setModalOpen(false);
    createMutation.reset();
  };
  const submitCreate = (event) => {
    event.preventDefault();
    createMutation.mutate({
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      ...(form.department.trim() ? { department: form.department.trim() } : {}),
    });
  };

  return (
    <div className="page-stack">
      <section className="page-heading admin-page-heading">
        <div>
          <div className="eyebrow">ADMINISTRATION</div>
          <h1>Staff</h1>
          <p>Manage doctor and receptionist accounts from one directory.</p>
        </div>
        <button
          className="button button-primary"
          type="button"
          onClick={() => openCreate()}
        >
          <Plus size={16} /> Add staff
        </button>
      </section>
      {notice && <div className="success-banner" role="status">{notice}</div>}

      <StaffDirectorySection directories={directories} onAdd={openCreate} onEdit={openEdit} />
      <StaffAccountModals
        create={modalOpen}
        editingStaff={editingStaff}
        editForm={editForm}
        setEditForm={setEditForm}
        updateMutation={updateMutation}
        onCloseEdit={() => setEditingStaff(null)}
        onSubmitEdit={submitEdit}
        form={form}
        createMutation={createMutation}
        updateForm={updateForm}
        onSubmitCreate={submitCreate}
        onCloseCreate={closeCreate}
      />
    </div>
  );
}
