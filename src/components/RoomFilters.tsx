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

  // Rango fijo de horas (8 a 21) para que la última opción sea 21:00-22:00
  const allHours = Array.from({ length: 14 }, (_, i) => i + 8); // [8, 9, ..., 21]

  // Opcional: puedes marcar cuáles están disponibles en las habitaciones filtradas
  const availableHoursSet = new Set<number>();
  roomStatuses.forEach(room => {
    room.availableHours.forEach(({ hour }) => {
      availableHoursSet.add(hour);
    });
  });

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
                {allHours.map(hour => (
                  <SelectItem key={hour} value={hour.toString()} disabled={!availableHoursSet.has(hour)}>
                    <div className={`flex items-center gap-2 w-full ${selectedHour === hour ? 'font-bold text-blue-700' : ''}`}>
                      <span>{hour}:00 - {hour + 1}:00</span>
                      {!availableHoursSet.has(hour) && (
                        <span className="text-xs text-gray-400 ml-2">(No rooms)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
