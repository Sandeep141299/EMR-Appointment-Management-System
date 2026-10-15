import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from '../api/api.js';
import { useSocketAppointments } from './useSocketAppointments.js';
import { validateSchedule } from '../utils/scheduleValidation.js';
import { toLocalDateString } from '../utils/date.js';

function createPeriod(name, index, startTime, endTime) {
  return { name: `${name} ${index}`, startTime, endTime };
}

function createDefaultSchedule() {
  return {
    workingDays: [1, 2, 3, 4, 5],
    sessions: [createPeriod('Session', 1, '09:00', '12:00')],
    slotDuration: 30,
    breaks: [],
    isActive: true,
  };
}

export default function useScheduleEditor() {
  const queryClient = useQueryClient();
  const [doctorId, setDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(new Date()));
  const [schedule, setSchedule] = useState(createDefaultSchedule);
  const [validationErrors, setValidationErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const loadedDoctorId = useRef('');
  const doctorsQuery = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => (await request('/doctors')).data,
  });
  const doctors = doctorsQuery.data || [];
  const scheduleQuery = useQuery({
    queryKey: ['doctor-schedule', doctorId],
    queryFn: async () => (await request(`/doctors/${doctorId}/schedule`)).data,
    enabled: Boolean(doctorId),
  });
  const slotsQuery = useQuery({
    queryKey: ['slots', doctorId, selectedDate],
    queryFn: async () => (await request('/slots', { query: { doctorId, date: selectedDate } })).data,
    enabled: Boolean(doctorId && selectedDate && scheduleQuery.isSuccess && !scheduleQuery.data?.requiresReconfiguration),
  });
  useSocketAppointments(doctorId, selectedDate, Boolean(doctorId && scheduleQuery.isSuccess));
  const saveMutation = useMutation({
    mutationFn: () => request(`/doctors/${doctorId}/schedule`, { method: 'PUT', body: schedule }),
    onSuccess: (result) => {
      queryClient.setQueryData(['doctor-schedule', doctorId], result.data);
      queryClient.invalidateQueries({ queryKey: ['slots', doctorId] });
      setValidationErrors({});
      setSaved(true);
    },
  });

  useEffect(() => {
    if (loadedDoctorId.current !== doctorId) {
      loadedDoctorId.current = doctorId;
      setSchedule(createDefaultSchedule());
      setValidationErrors({});
      setSaved(false);
    }
    if (!doctorId || !scheduleQuery.isSuccess) return;
    const savedSchedule = scheduleQuery.data;
    setSchedule(savedSchedule && !savedSchedule.requiresReconfiguration ? savedSchedule : createDefaultSchedule());
  }, [doctorId, scheduleQuery.data, scheduleQuery.isSuccess]);

  const slots = slotsQuery.data || [];
  const slotSummary = useMemo(() => ({
    available: slots.filter((slot) => slot.status === 'available').length,
    booked: slots.filter((slot) => slot.status === 'booked').length,
  }), [slots]);
  const updatePeriod = (field, index, key, value) => {
    setSaved(false);
    setValidationErrors({});
    setSchedule((current) => ({
      ...current,
      [field]: current[field].map((period, periodIndex) => (
        periodIndex === index ? { ...period, [key]: value } : period
      )),
    }));
  };
  const toggleWorkingDay = (day) => {
    setSaved(false);
    setSchedule((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((value) => value !== day)
        : [...current.workingDays, day].sort((left, right) => left - right),
    }));
    setValidationErrors({});
  };
  const addPeriod = (field) => {
    setSaved(false);
    setSchedule((current) => ({
      ...current,
      [field]: [
        ...current[field],
        field === 'sessions'
          ? createPeriod('Session', current.sessions.length + 1, '09:00', '12:00')
          : createPeriod('Break', current.breaks.length + 1, '12:00', '13:00'),
      ],
    }));
  };
  const removePeriod = (field, index) => {
    setSaved(false);
    setSchedule((current) => ({ ...current, [field]: current[field].filter((_, periodIndex) => periodIndex !== index) }));
    setValidationErrors({});
  };
  const saveSchedule = (event) => {
    event.preventDefault();
    const errors = validateSchedule(schedule);
    setValidationErrors(errors);
    setSaved(false);
    if (Object.keys(errors).length > 0) return;
    saveMutation.mutate();
  };
  const changeSlotDuration = (event) => {
    setSaved(false);
    setValidationErrors({});
    setSchedule((current) => ({ ...current, slotDuration: Number(event.target.value) }));
  };

  return {
    doctorId, setDoctorId, selectedDate, setSelectedDate, schedule, setSchedule,
    validationErrors, saved, doctorsQuery, doctors, scheduleQuery, slotsQuery,
    slots, slotSummary, saveMutation, saveSchedule, toggleWorkingDay, addPeriod,
    removePeriod, changeSlotDuration,
    updatePeriodTime: (field, index, key, value) => updatePeriod(field, index, key, value),
    updatePeriodName: (field, index, value) => updatePeriod(field, index, 'name', value),
    selectedDoctor: doctors.find((doctor) => doctor.id === doctorId),
    sessionsInvalid: Object.keys(validationErrors).some((key) => key.startsWith('sessions.')),
    breaksInvalid: Object.keys(validationErrors).some((key) => key.startsWith('breaks.')),
  };
}
