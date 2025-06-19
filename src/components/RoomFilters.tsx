
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface RoomFiltersProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedHour: number | undefined;
  onHourChange: (hour: number | undefined) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
}

export const RoomFilters = ({
  selectedDate,
  onDateChange,
  selectedHour,
  onHourChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange
}: RoomFiltersProps) => {
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
  
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30); // Allow booking up to 30 days ahead

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => onDateChange(new Date(e.target.value))}
              min={today.toISOString().split('T')[0]}
              max={maxDate.toISOString().split('T')[0]}
            />
          </div>

          <div>
            <Label htmlFor="hour">Time Slot (Optional)</Label>
            <Select value={selectedHour?.toString() || "all"} onValueChange={(value) => onHourChange(value === "all" ? undefined : parseInt(value))}>
              <SelectTrigger>
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

          <div>
            <Label htmlFor="status">Availability</Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rooms</SelectItem>
                <SelectItem value="available">Available only</SelectItem>
                <SelectItem value="partial">Partially available</SelectItem>
                <SelectItem value="full">Fully booked</SelectItem>
                <SelectItem value="private">Private bookings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Booking Type</Label>
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="shared">Shared only</SelectItem>
                <SelectItem value="private">Private only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
