
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Classroom, Reservation, RoomStatus } from '@/types/booking';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export const useRoomData = (selectedDate: Date, selectedHour?: number) => {
  // Fetch classrooms
  const { data: classrooms = [], isLoading: classroomsLoading } = useQuery({
    queryKey: ['classrooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Classroom[];
    },
  });

  // Fetch reservations for the selected date
  const { data: reservations = [], isLoading: reservationsLoading, refetch } = useQuery({
    queryKey: ['reservations', selectedDate.toDateString()],
    queryFn: async () => {
      // Expire old reservations first
      await supabase.rpc('expire_old_reservations');
      
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .gte('start_time', startOfDay.toISOString())
        .lt('start_time', endOfDay.toISOString())
        .in('status', ['reserved', 'checked_in']);
      
      if (error) throw error;
      return data as Reservation[];
    },
  });

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase.channel('room-bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reservations' },
        () => {
          console.log('Reservation changed, refetching...');
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Calculate room status
  const getRoomStatus = (classroom: Classroom, hour?: number): RoomStatus => {
    const roomReservations = reservations.filter(r => r.classroom_id === classroom.id);
    
    if (hour !== undefined) {
      // Check specific hour
      const hourStart = new Date(selectedDate);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(selectedDate);
      hourEnd.setHours(hour + 1, 0, 0, 0);
      
      const overlappingReservations = roomReservations.filter(r => {
        const resStart = new Date(r.start_time);
        const resEnd = new Date(r.end_time);
        return resStart < hourEnd && resEnd > hourStart;
      });
      
      const privateReservation = overlappingReservations.find(r => r.is_private);
      if (privateReservation) {
        return {
          id: classroom.id,
          name: classroom.name,
          capacity: classroom.capacity,
          currentOccupancy: classroom.capacity,
          status: 'private'
        };
      }
      
      const currentOccupancy = overlappingReservations.length;
      const status = currentOccupancy === 0 ? 'available' : 
                   currentOccupancy === classroom.capacity ? 'full' : 'partial';
      
      return {
        id: classroom.id,
        name: classroom.name,
        capacity: classroom.capacity,
        currentOccupancy,
        status
      };
    }
    
    // General status for the day
    const hasPrivate = roomReservations.some(r => r.is_private);
    if (hasPrivate) {
      return {
        id: classroom.id,
        name: classroom.name,
        capacity: classroom.capacity,
        currentOccupancy: classroom.capacity,
        status: 'private'
      };
    }
    
    const maxOccupancy = Math.max(0, ...Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date(selectedDate);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(selectedDate);
      hourEnd.setHours(hour + 1, 0, 0, 0);
      
      return roomReservations.filter(r => {
        const resStart = new Date(r.start_time);
        const resEnd = new Date(r.end_time);
        return resStart < hourEnd && resEnd > hourStart && !r.is_private;
      }).length;
    }));
    
    const status = maxOccupancy === 0 ? 'available' : 
                   maxOccupancy === classroom.capacity ? 'full' : 'partial';
    
    return {
      id: classroom.id,
      name: classroom.name,
      capacity: classroom.capacity,
      currentOccupancy: maxOccupancy,
      status
    };
  };

  const roomStatuses = classrooms.map(classroom => getRoomStatus(classroom, selectedHour));

  return {
    classrooms,
    reservations,
    roomStatuses,
    isLoading: classroomsLoading || reservationsLoading,
    refetch
  };
};
