import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useSearchParams } from 'react-router-dom';
import BookingForm from '../components/BookingForm.jsx';
import BookingPatientBanner from '../components/BookingPatientBanner.jsx';
import RoleGate from '../components/RoleGate.jsx';
import SchedulerAside from '../components/SchedulerAside.jsx';
import SchedulerAvailability from '../components/SchedulerAvailability.jsx';
import SchedulerFilters from '../components/SchedulerFilters.jsx';
import { useRole } from '../hooks/useRole.js';
import { useSocketAppointments } from '../hooks/useSocketAppointments.js';
import { request } from '../api/api.js';
import { startOfToday, toLocalDateString } from '../utils/date.js';

export default function SchedulerPage() {
  const { can } = useRole();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const patientIdForBooking = searchParams.get('patientId') || '';
  const bookingShortcut = location.pathname === '/book-appointment' || searchParams.get('mode') === 'book';
  const [department, setDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [date, setDate] = useState(toLocalDateString(startOfToday()));
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingNotice, setBookingNotice] = useState('');
  const doctorSelectRef = useRef(null);
  const canBook = can('BOOK_APPOINTMENT');

  useEffect(() => {
    if (bookingShortcut) doctorSelectRef.current?.focus();
  }, [bookingShortcut]);
  const doctorsQuery = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => (await request('/doctors')).data,
  });
  const bookingPatientQuery = useQuery({
    queryKey: ['booking-patient', patientIdForBooking],
    queryFn: async () => {
      const result = await request('/patients', { query: { search: patientIdForBooking, pageSize: 20 } });
      return result.data.find((patient) => patient.patientId === patientIdForBooking) || null;
    },
    enabled: Boolean(patientIdForBooking),
  });
  const doctors = department
    ? (doctorsQuery.data || []).filter((doctor) => doctor.department === department)
    : doctorsQuery.data || [];
  const departments = useMemo(
    () => [...new Set(doctorsQuery.data?.map((doctor) => doctor.department) || [])].sort(),
    [doctorsQuery.data],
  );
  const slotsQuery = useQuery({
    queryKey: ['slots', selectedDoctor, date],
    queryFn: async () => (await request('/slots', { query: { doctorId: selectedDoctor, date } })).data,
    enabled: Boolean(selectedDoctor && date),
  });
  useSocketAppointments(selectedDoctor, date, true);

  const bookingComplete = useCallback(() => {
    setSelectedSlot('');
    setBookingNotice('Appointment booked successfully.');
    queryClient.invalidateQueries({ queryKey: ['slots', selectedDoctor, date] });
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
  }, [queryClient, selectedDoctor, date]);
  const changeDepartment = (value) => {
    setDepartment(value);
    setSelectedDoctor('');
    setSelectedSlot('');
  };
  const changeDoctor = (value) => {
    setSelectedDoctor(value);
    setSelectedSlot('');
    setBookingNotice('');
  };
  const updateDate = (value) => {
    setDate(value);
    setSelectedSlot('');
    setBookingNotice('');
  };
  const shiftDate = (direction) => {
    const current = new Date(`${date}T12:00:00`);
    current.setDate(current.getDate() + direction);
    updateDate(toLocalDateString(current));
  };
  const selectedDoctorDetails = doctors.find((doctor) => doctor.id === selectedDoctor);
  const currentDate = new Date(`${date}T12:00:00`);
  const today = new Date();
  const isToday = currentDate.getFullYear() === today.getFullYear()
    && currentDate.getMonth() === today.getMonth()
    && currentDate.getDate() === today.getDate();

  return (
    <div className="page-stack">
      <section className="page-heading scheduler-heading">
        <div><div className="eyebrow">SCHEDULING</div><h1>Appointment scheduler</h1><p>Find a time that works. Make every visit count.</p></div>
        <div className="scheduler-heading-actions">
          <RoleGate permission="BOOK_APPOINTMENT">
            <button className="button button-primary" type="button" onClick={() => doctorSelectRef.current?.focus()}>Book appointment</button>
          </RoleGate>
          <div className="live-indicator"><span /> Live availability</div>
        </div>
      </section>
      {bookingNotice && <div className="success-banner" role="status"><span>{bookingNotice}</span><button type="button" onClick={() => setBookingNotice('')} aria-label="Dismiss message">×</button></div>}
      {patientIdForBooking && <BookingPatientBanner query={bookingPatientQuery} />}
      <SchedulerFilters
        department={department}
        changeDepartment={changeDepartment}
        departments={departments}
        doctorSelectRef={doctorSelectRef}
        selectedDoctor={selectedDoctor}
        changeDoctor={changeDoctor}
        doctors={doctors}
        doctorsQuery={doctorsQuery}
        date={date}
        updateDate={updateDate}
      />
      <div className={`scheduler-layout${selectedSlot && canBook ? ' has-booking' : ''}`}>
        <SchedulerAvailability
          currentDate={currentDate}
          isToday={isToday}
          shiftDate={shiftDate}
          updateDate={updateDate}
          selectedDoctor={selectedDoctor}
          selectedDoctorDetails={selectedDoctorDetails}
          slotsQuery={slotsQuery}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          canBook={canBook}
        />
        {selectedSlot && canBook ? (
          <RoleGate permission="BOOK_APPOINTMENT">
            <BookingForm
              doctorId={selectedDoctor}
              date={date}
              slotStart={selectedSlot}
              initialPatient={bookingPatientQuery.data || null}
              onBooked={bookingComplete}
            />
          </RoleGate>
        ) : (
          <SchedulerAside canBook={canBook} />
        )}
      </div>
    </div>
  );
}
