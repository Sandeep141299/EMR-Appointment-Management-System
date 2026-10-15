import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { getAccessToken } from '../api/api.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocketAppointments(doctorId, date, enabled) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return undefined;
    const token = getAccessToken();
    if (!token) return undefined;

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
    });

    socket.on('connect', () => {
      if (doctorId && date) {
        socket.emit('appointment:subscribe', { doctorId, date });
      }
    });

    const refreshAppointmentData = (event) => {
      queryClient.invalidateQueries({ queryKey: ['slots', event.doctorId, event.date] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    };

    socket.on('appointment:created', refreshAppointmentData);
    socket.on('appointment:updated', refreshAppointmentData);
    socket.on('appointment:cancelled', refreshAppointmentData);

    return () => {
      socket.disconnect();
    };
  }, [doctorId, date, enabled, queryClient]);
}
