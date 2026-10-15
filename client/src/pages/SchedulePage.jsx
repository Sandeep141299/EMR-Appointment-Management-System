import ScheduleEditorForm from '../components/ScheduleEditorForm.jsx';
import ScheduleSlotPreview from '../components/ScheduleSlotPreview.jsx';
import useScheduleEditor from '../hooks/useScheduleEditor.js';

export default function SchedulePage() {
  const scheduleEditor = useScheduleEditor();
  const {
    doctorId,
    setDoctorId,
    selectedDate,
    setSelectedDate,
    doctors,
    doctorsQuery,
    scheduleQuery,
    selectedDoctor,
    schedule,
    validationErrors,
    sessionsInvalid,
    breaksInvalid,
    saveMutation,
    saved,
    saveSchedule,
    toggleWorkingDay,
    changeSlotDuration,
    updatePeriodName,
    updatePeriodTime,
    removePeriod,
    addPeriod,
    slotsQuery,
    slots,
    slotSummary,
  } = scheduleEditor;

  return (
    <div className="page-stack">
      <section className="page-heading admin-page-heading">
        <div>
          <div className="eyebrow">ADMINISTRATION</div>
          <h1>Doctor schedules</h1>
          <p>Set recurring working days, sessions, breaks, and appointment length.</p>
        </div>
      </section>
      <div className="schedule-admin-layout">
        <ScheduleEditorForm
          doctorId={doctorId}
          setDoctorId={setDoctorId}
          doctors={doctors}
          doctorsQuery={doctorsQuery}
          scheduleQuery={scheduleQuery}
          selectedDoctor={selectedDoctor}
          schedule={schedule}
          validationErrors={validationErrors}
          sessionsInvalid={sessionsInvalid}
          breaksInvalid={breaksInvalid}
          saveMutation={saveMutation}
          saved={saved}
          saveSchedule={saveSchedule}
          toggleWorkingDay={toggleWorkingDay}
          changeSlotDuration={changeSlotDuration}
          updatePeriodName={updatePeriodName}
          updatePeriodTime={updatePeriodTime}
          removePeriod={removePeriod}
          addPeriod={addPeriod}
        />
        <ScheduleSlotPreview
          doctorId={doctorId}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          slotsQuery={slotsQuery}
          slots={slots}
          slotSummary={slotSummary}
        />
      </div>
    </div>
  );
}
