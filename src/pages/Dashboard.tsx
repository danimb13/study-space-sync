
import { useState } from 'react';
import { RoomCard } from '@/components/RoomCard';
import { BookingModal } from '@/components/BookingModal';
import { RoomFilters } from '@/components/RoomFilters';
import { useRoomData } from '@/hooks/useRoomData';
import { Classroom } from '@/types/booking';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);

  const { roomStatuses, classrooms, isLoading, refetch } = useRoomData(selectedDate, selectedHour);

  const handleBookRoom = (roomId: string) => {
    const classroom = classrooms.find(c => c.id === roomId);
    if (classroom) {
      setSelectedClassroom(classroom);
      setBookingModalOpen(true);
    }
  };

  const filteredRooms = roomStatuses.filter(room => {
    if (statusFilter !== 'all' && room.status !== statusFilter) return false;
    if (typeFilter === 'shared' && room.status === 'private') return false;
    if (typeFilter === 'private' && room.status !== 'private') return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">University Room Booking System</h1>
        
        <RoomFilters
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedHour={selectedHour}
          onHourChange={setSelectedHour}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onBook={handleBookRoom}
              selectedHour={selectedHour}
            />
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No rooms match your current filters.</p>
          </div>
        )}

        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          classroom={selectedClassroom}
          selectedDate={selectedDate}
          onSuccess={refetch}
        />
      </div>
    </div>
  );
};

export default Dashboard;
