
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface RoomFiltersProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedHour: number | undefined;
  onHourChange: (hour: number | undefined) => void;
}

export const RoomFilters = ({
  selectedDate,
  onDateChange,
  selectedHour,
  onHourChange
}: RoomFiltersProps) => {
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
  
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30); // Allow booking up to 30 days ahead

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
                <SelectValue placeholder="All hours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All hours</SelectItem>
                {hours.map(hour => (
                  <SelectItem key={hour} value={hour.toString()}>
                    {hour}:00 - {hour + 1}:00
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
