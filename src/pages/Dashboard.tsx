
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
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);

  const { roomStatuses, classrooms, isLoading, refetch, getRoomTypeDisplay } = useRoomData(selectedDate, selectedHour);

  const handleBookRoom = (roomId: string) => {
    const classroom = classrooms.find(c => c.id === roomId);
    if (classroom) {
      setSelectedClassroom(classroom);
      setBookingModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">University Room Booking</h1>
          <p className="text-gray-600 text-lg">Reserve your perfect study space</p>
        </div>
        
        <RoomFilters
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedHour={selectedHour}
          onHourChange={setSelectedHour}
          roomStatuses={roomStatuses}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomStatuses.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onBook={handleBookRoom}
              selectedHour={selectedHour}
              getRoomTypeDisplay={getRoomTypeDisplay}
            />
          ))}
        </div>

        {roomStatuses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No rooms available for the selected criteria.</p>
            <p className="text-gray-400 text-sm mt-2">Try selecting a different date or time.</p>
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
