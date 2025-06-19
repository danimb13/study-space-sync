
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
  const getStatusBadge = (status: string, currentOccupancy: number, capacity: number) => {
    switch (status) {
      case 'available':
        return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">Available</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Shared ({currentOccupancy}/{capacity})</Badge>;
      case 'private':
        return <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">Private</Badge>;
      case 'full':
        return <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">Full</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const isBookable = room.status === 'available' || room.status === 'partial';

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-md border border-gray-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold text-gray-900">{room.name}</CardTitle>
          {getStatusBadge(room.status, room.currentOccupancy, room.capacity)}
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
          disabled={!isBookable}
          className={`w-full ${isBookable 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-100 text-gray-500 cursor-not-allowed'
          }`}
          variant={isBookable ? "default" : "secondary"}
        >
          {isBookable ? 'Book Room' : 'Unavailable'}
        </Button>
      </CardContent>
    </Card>
  );
};
