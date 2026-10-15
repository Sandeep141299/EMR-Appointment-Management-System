import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { authenticateSocket } from './socketAuth.js';
import { adminAppointmentsRoom, doctorDateRoom } from '../utils/appointmentRooms.js';
import { parseCalendarDate } from '../utils/calendarDate.js';

let socketServer;

export function createAppointmentEventEmitter(io) {
  return function emitAppointmentEvent(eventName, appointment) {
    const doctorId = appointment.doctorId?._id || appointment.doctorId;
    const date = appointment.date instanceof Date
      ? appointment.date.toISOString().slice(0, 10)
      : appointment.date;
    const payload = {
      appointmentId: appointment._id.toString(),
      doctorId: doctorId.toString(),
      date,
      slotStart: appointment.slotStart,
      status: appointment.status,
    };

    io.to([doctorDateRoom(payload.doctorId, date), adminAppointmentsRoom])
      .emit(eventName, payload);
  };
}

let emitEvent = () => {};

export function initializeSocketServer(httpServer) {
  if (socketServer) {
    throw new Error('Socket.IO server has already been initialized');
  }

  socketServer = new Server(httpServer, {
    cors: {
      origin: env.clientUrls,
      credentials: true,
    },
  });
  emitEvent = createAppointmentEventEmitter(socketServer);

  socketServer.use(authenticateSocket);
  socketServer.on('connection', (socket) => {
    if (['SUPER_ADMIN', 'RECEPTIONIST'].includes(socket.data.user.role)) {
      socket.join(adminAppointmentsRoom);
    }

    socket.on('appointment:subscribe', (request, acknowledge) => {
      const result = joinDoctorDateRoom(socket, request);
      if (typeof acknowledge === 'function') {
        acknowledge(result);
      }
    });
  });

  return socketServer;
}

export function joinDoctorDateRoom(socket, request) {
  const { doctorId, date } = request || {};
  if (
    typeof doctorId !== 'string'
    || !/^[a-f\d]{24}$/i.test(doctorId)
    || typeof date !== 'string'
    || !parseCalendarDate(date)
  ) {
    return { success: false, message: 'A valid doctorId and date are required' };
  }

  const user = socket.data.user;
  if (!['SUPER_ADMIN', 'RECEPTIONIST'].includes(user?.role) && user?.doctorId !== doctorId) {
    return { success: false, message: 'You cannot subscribe to this doctor’s appointments' };
  }

  socket.join(doctorDateRoom(doctorId, date));
  return { success: true, message: 'Subscribed to appointment updates' };
}

export function emitAppointmentEvent(eventName, appointment) {
  emitEvent(eventName, appointment);
}
