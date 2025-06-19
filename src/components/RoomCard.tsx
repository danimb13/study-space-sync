
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoomStatus } from '@/types/booking';
import { Users, Clock } from 'lucide-react';

interface RoomCardProps {
  room: RoomStatus;
  onBook: (roomId: string) => void;
  selectedHour?: number;
}

export const RoomCard = ({ room, onBook, selectedHour }: RoomCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'partial': return 'bg-blue-500';
      case 'private': return 'bg-red-500';
      case 'full': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'partial': return 'Partially Booked';
      case 'private': return 'Private Booking';
      case 'full': return 'Fully Booked';
      default: return 'Unknown';
    }
  };

  const isBookable = room.status === 'available' || room.status === 'partial';

  return (
    <Card className={`h-full transition-all duration-200 hover:shadow-lg border-2 ${getStatusColor(room.status)} border-opacity-20`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{room.name}</CardTitle>
          <div className={`w-4 h-4 rounded-full ${getStatusColor(room.status)}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="text-sm">
            {room.currentOccupancy}/{room.capacity} students
          </span>
        </div>
        
        <Badge 
          variant="secondary" 
          className={`${getStatusColor(room.status)} text-white`}
        >
          {getStatusText(room.status)}
        </Badge>
        
        {selectedHour !== undefined && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{selectedHour}:00 - {selectedHour + 1}:00</span>
          </div>
        )}
        
        <Button 
          onClick={() => onBook(room.id)}
          disabled={!isBookable}
          className="w-full"
          variant={isBookable ? "default" : "secondary"}
        >
          {isBookable ? 'Book Room' : 'Unavailable'}
        </Button>
      </CardContent>
    </Card>
  );
};
