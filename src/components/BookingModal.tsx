
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Classroom, Reservation } from '@/types/booking';
import { Calendar, Clock, Users, Building, MapPin } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom | null;
  selectedDate: Date;
  onSuccess: () => void;
}

export const BookingModal = ({ isOpen, onClose, classroom, selectedDate, onSuccess }: BookingModalProps) => {
  const [email, setEmail] = useState('');
  const [startHour, setStartHour] = useState('');
  const [duration, setDuration] = useState('1');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<Array<{ hour: number; isShared: boolean }>>([]);

  const getRoomTypeDisplay = (roomType: string) => {
    switch (roomType) {
      case 'meeting_room': return 'Meeting Room';
      case 'conference_room': return 'Conference Room';
      case 'computer_room': return 'Computer Room';
      case 'study_room': return 'Study Room';
      default: return 'Room';
    }
  };

  useEffect(() => {
    if (isOpen && classroom) {
      fetchAvailableTimes();
      setEmail('');
      setStartHour('');
      setDuration('1');
      setIsPrivate(false);
    }
  }, [isOpen, classroom, selectedDate]);

  const fetchAvailableTimes = async () => {
    if (!classroom) return;

    try {
      await supabase.rpc('expire_old_reservations');

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('classroom_id', classroom.id)
        .gte('start_time', startOfDay.toISOString())
        .lt('start_time', endOfDay.toISOString())
        .in('status', ['reserved', 'checked_in']);

      if (error) throw error;

      const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
      const available: Array<{ hour: number; isShared: boolean }> = [];

      for (const hour of hours) {
        const hourStart = new Date(selectedDate);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(selectedDate);
        hourEnd.setHours(hour + 1, 0, 0, 0);

        const overlappingReservations = reservations.filter((r: Reservation) => {
          const resStart = new Date(r.start_time);
          const resEnd = new Date(r.end_time);
          return resStart < hourEnd && resEnd > hourStart;
        });

        const privateReservation = overlappingReservations.find((r: Reservation) => r.is_private);
        const currentOccupancy = overlappingReservations.length;

        if (!privateReservation && currentOccupancy < classroom.capacity) {
          available.push({
            hour,
            isShared: currentOccupancy > 0
          });
        }
      }

      setAvailableTimes(available);
    } catch (error) {
      console.error('Error fetching available times:', error);
      toast({
        title: "Error",
        description: "Failed to load available times",
        variant: "destructive"
      });
    }
  };

  const getAvailableDurations = (startHour: number) => {
    if (!startHour) return [];
    
    const durations = [];
    const maxEndHour = 21; // 9 PM
    
    for (let duration = 1; duration <= maxEndHour - startHour; duration++) {
      const endHour = startHour + duration;
      
      // Check if all hours in the duration are available
      const allHoursAvailable = Array.from({ length: duration }, (_, i) => startHour + i)
        .every(hour => availableTimes.some(t => t.hour === hour));
      
      if (allHoursAvailable) {
        durations.push({ value: duration.toString(), label: `${duration} hour${duration > 1 ? 's' : ''}` });
      } else {
        break; // Stop at first unavailable hour
      }
    }
    
    return durations;
  };

  const validateEmail = (email: string) => {
    return email.endsWith('@alumni.esade.edu');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classroom || !startHour) return;

    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please use your university email ending with @alumni.esade.edu",
        variant: "destructive"
      });
      return;
    }

    const startTime = new Date(selectedDate);
    startTime.setHours(parseInt(startHour), 0, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + parseInt(duration));

    setIsLoading(true);

    try {
      await supabase.rpc('expire_old_reservations');

      const { data: canBook, error: checkError } = await supabase.rpc('can_make_reservation', {
        p_classroom_id: classroom.id,
        p_start_time: startTime.toISOString(),
        p_end_time: endTime.toISOString(),
        p_is_private: isPrivate
      });

      if (checkError) throw checkError;

      if (!canBook) {
        toast({
          title: "Booking Unavailable",
          description: "This time slot is no longer available. Please refresh and try another time.",
          variant: "destructive"
        });
        fetchAvailableTimes();
        return;
      }

      const { error: insertError } = await supabase
        .from('reservations')
        .insert({
          classroom_id: classroom.id,
          student_email: email,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          is_private: isPrivate
        });

      if (insertError) throw insertError;

      toast({
        title: "Booking Confirmed!",
        description: `Room ${classroom.name} reserved for ${selectedDate.toLocaleDateString()} from ${startHour}:00 to ${parseInt(startHour) + parseInt(duration)}:00`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error creating your reservation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!classroom) return null;

  const availableDurations = startHour ? getAvailableDurations(parseInt(startHour)) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Book {classroom.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Room Information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-blue-800">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{classroom.building}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <Building className="w-4 h-4" />
                <span>{getRoomTypeDisplay(classroom.room_type)}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <Users className="w-4 h-4" />
                <span>Capacity: {classroom.capacity} students</span>
              </div>
            </div>
          </div>

          {/* Date Confirmation */}
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Booking Date: {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">University Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@alumni.esade.edu"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Select value={startHour} onValueChange={(value) => {
                setStartHour(value);
                setDuration('1'); // Reset duration when start time changes
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.length === 0 ? (
                    <SelectItem value="none" disabled>No available times</SelectItem>
                  ) : (
                    availableTimes.map(({ hour, isShared }) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        <div className="flex items-center gap-2 w-full">
                          <Clock className="w-4 h-4" />
                          <span>{hour}:00 - {hour + 1}:00</span>
                          {isShared && (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs ml-2">
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

            {startHour && (
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDurations.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="private" className="text-sm">
                Private booking (entire room)
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !startHour || availableTimes.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Booking...' : 'Book Room'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
