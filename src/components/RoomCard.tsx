
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoomStatus } from '@/types/booking';
import { Users, Clock, MapPin, Home } from 'lucide-react';

interface RoomCardProps {
  room: RoomStatus;
  onBook: (roomId: string) => void;
  selectedHour?: number;
  getRoomTypeDisplay: (roomType: string) => string;
}

export const RoomCard = ({ room, onBook, selectedHour, getRoomTypeDisplay }: RoomCardProps) => {
  const getStatusBadge = () => {
    if (selectedHour !== undefined) {
      const hourData = room.availableHours.find(h => h.hour === selectedHour);
      if (hourData?.isShared) {
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Shared</Badge>;
      }
    } else if (room.status === 'partial') {
      return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Has Shared Hours</Badge>;
    }
    return null;
  };

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-lg border border-gray-100 bg-white hover:border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl font-semibold text-gray-900">{room.name}</CardTitle>
          {getStatusBadge()}
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{room.building}</span>
          </div>
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            <span>{getRoomTypeDisplay(room.room_type)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-4 h-4" />
          <span className="text-sm">
            Capacity: {room.capacity} students
          </span>
        </div>
        
        {selectedHour !== undefined && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4" />
            <span>{selectedHour}:00 - {selectedHour + 1}:00</span>
          </div>
        )}
        
        <Button 
          onClick={() => onBook(room.id)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          Book Room
        </Button>
      </CardContent>
    </Card>
  );
};
