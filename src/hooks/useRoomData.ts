
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Classroom, Reservation, RoomStatus } from '@/types/booking';
import { useEffect } from 'react';

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

  const getRoomTypeDisplay = (roomType: string) => {
    switch (roomType) {
      case 'meeting_room': return 'Meeting Room';
      case 'conference_room': return 'Conference Room';
      case 'computer_room': return 'Computer Room';
      case 'study_room': return 'Study Room';
      default: return 'Room';
    }
  };

  // Calculate room status and available hours
  const getRoomStatus = (classroom: Classroom): RoomStatus | null => {
    const roomReservations = reservations.filter(r => r.classroom_id === classroom.id);
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
    
    const availableHours: Array<{ hour: number; isShared: boolean }> = [];
    let hasAnyAvailability = false;
    
    for (const hour of hours) {
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
      const currentOccupancy = overlappingReservations.length;
      
      // Hour is available if no private booking and under capacity
      if (!privateReservation && currentOccupancy < classroom.capacity) {
        availableHours.push({
          hour,
          isShared: currentOccupancy > 0
        });
        hasAnyAvailability = true;
      }
    }
    
    // Only return rooms that have some availability
    if (!hasAnyAvailability) {
      return null;
    }
    
    // If filtering by specific hour, check if that hour is available
    if (selectedHour !== undefined) {
      const hourAvailable = availableHours.find(h => h.hour === selectedHour);
      if (!hourAvailable) {
        return null;
      }
      
      return {
        id: classroom.id,
        name: classroom.name,
        capacity: classroom.capacity,
        building: classroom.building,
        room_type: classroom.room_type,
        currentOccupancy: hourAvailable.isShared ? 1 : 0,
        status: hourAvailable.isShared ? 'partial' : 'available',
        availableHours: [hourAvailable]
      };
    }
    
    // For general view, determine overall status
    const hasSharedHours = availableHours.some(h => h.isShared);
    const status = hasSharedHours ? 'partial' : 'available';
    
    return {
      id: classroom.id,
      name: classroom.name,
      capacity: classroom.capacity,
      building: classroom.building,
      room_type: classroom.room_type,
      currentOccupancy: 0,
      status,
      availableHours
    };
  };

  const roomStatuses = classrooms
    .map(classroom => getRoomStatus(classroom))
    .filter((room): room is RoomStatus => room !== null);

  return {
    classrooms,
    reservations,
    roomStatuses,
    isLoading: classroomsLoading || reservationsLoading,
    refetch,
    getRoomTypeDisplay
  };
};
