
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RoomStatus } from '@/types/booking';

interface RoomFiltersProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedHour: number | undefined;
  onHourChange: (hour: number | undefined) => void;
  roomStatuses: RoomStatus[];
}

export const RoomFilters = ({
  selectedDate,
  onDateChange,
  selectedHour,
  onHourChange,
  roomStatuses
}: RoomFiltersProps) => {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30); // Allow booking up to 30 days ahead

  // Get all available hours across all rooms
  const getAvailableHours = () => {
    const allHours = new Set<number>();
    const sharedHours = new Set<number>();
    
    roomStatuses.forEach(room => {
      room.availableHours.forEach(({ hour, isShared }) => {
        allHours.add(hour);
        if (isShared) {
          sharedHours.add(hour);
        }
      });
    });
    
    return Array.from(allHours)
      .sort((a, b) => a - b)
      .map(hour => ({
        hour,
        isShared: sharedHours.has(hour)
      }));
  };

  const availableHours = getAvailableHours();

  return (
    <Card className="mb-6 border-blue-100 bg-gradient-to-r from-blue-50 to-white">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="date" className="text-gray-700 font-medium">Select Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => onDateChange(new Date(e.target.value))}
              min={today.toISOString().split('T')[0]}
              max={maxDate.toISOString().split('T')[0]}
              className="mt-1 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="hour" className="text-gray-700 font-medium">Time Slot (Optional)</Label>
            <Select value={selectedHour?.toString() || "all"} onValueChange={(value) => onHourChange(value === "all" ? undefined : parseInt(value))}>
              <SelectTrigger className="mt-1 border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="All available hours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All available hours</SelectItem>
                {availableHours.length === 0 ? (
                  <SelectItem value="none" disabled>No available times</SelectItem>
                ) : (
                  availableHours.map(({ hour, isShared }) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      <div className="flex items-center gap-2 w-full">
                        <span>{hour}:00 - {hour + 1}:00</span>
                        {isShared && (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            Shared
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
