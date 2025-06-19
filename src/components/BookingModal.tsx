
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Classroom, Reservation } from '@/types/booking';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom | null;
  selectedDate: Date;
  onSuccess: () => void;
}

export const BookingModal = ({ isOpen, onClose, classroom, selectedDate, onSuccess }: BookingModalProps) => {
  const [email, setEmail] = useState('');
  const [startHour, setStartHour] = useState<number>(9);
  const [duration, setDuration] = useState<number>(1);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableHours, setAvailableHours] = useState<number[]>([]);
  const [availableDurations, setAvailableDurations] = useState<number[]>([]);

  const validateEmail = (email: string) => {
    return email.endsWith('@alumni.esade.edu');
  };

  // Check available hours when modal opens or settings change
  useEffect(() => {
    const checkAvailability = async () => {
      if (!classroom || !isOpen) return;

      try {
        // Expire old reservations first
        await supabase.rpc('expire_old_reservations');

        const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
        const available: number[] = [];

        for (const hour of hours) {
          const startTime = new Date(selectedDate);
          startTime.setHours(hour, 0, 0, 0);
          const endTime = new Date(selectedDate);
          endTime.setHours(hour + 1, 0, 0, 0);

          const { data: canBook } = await supabase.rpc('can_make_reservation', {
            p_classroom_id: classroom.id,
            p_start_time: startTime.toISOString(),
            p_end_time: endTime.toISOString(),
            p_is_private: isPrivate
          });

          if (canBook) {
            available.push(hour);
          }
        }

        setAvailableHours(available);
        
        // Set default start hour to first available
        if (available.length > 0 && !available.includes(startHour)) {
          setStartHour(available[0]);
        }
      } catch (error) {
        console.error('Error checking availability:', error);
      }
    };

    checkAvailability();
  }, [classroom, selectedDate, isPrivate, isOpen, startHour]);

  // Check available durations when start hour changes
  useEffect(() => {
    const checkDurations = async () => {
      if (!classroom || !availableHours.includes(startHour)) return;

      const maxDuration = 3;
      const available: number[] = [];

      for (let dur = 1; dur <= maxDuration; dur++) {
        const startTime = new Date(selectedDate);
        startTime.setHours(startHour, 0, 0, 0);
        const endTime = new Date(selectedDate);
        endTime.setHours(startHour + dur, 0, 0, 0);

        try {
          const { data: canBook } = await supabase.rpc('can_make_reservation', {
            p_classroom_id: classroom.id,
            p_start_time: startTime.toISOString(),
            p_end_time: endTime.toISOString(),
            p_is_private: isPrivate
          });

          if (canBook) {
            available.push(dur);
          }
        } catch (error) {
          console.error('Error checking duration:', error);
          break;
        }
      }

      setAvailableDurations(available);
      
      // Reset duration if current selection is not available
      if (available.length > 0 && !available.includes(duration)) {
        setDuration(available[0]);
      }
    };

    checkDurations();
  }, [classroom, selectedDate, startHour, isPrivate, availableHours, duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classroom) return;
    
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please use your university email ending with @alumni.esade.edu",
        variant: "destructive"
      });
      return;
    }

    if (!availableHours.includes(startHour)) {
      toast({
        title: "Time Slot Unavailable",
        description: "The selected time slot is no longer available",
        variant: "destructive"
      });
      return;
    }

    if (!availableDurations.includes(duration)) {
      toast({
        title: "Duration Unavailable",
        description: "The selected duration is no longer available",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const startTime = new Date(selectedDate);
      startTime.setHours(startHour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(startHour + duration, 0, 0, 0);

      // Double-check availability before booking
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
          description: "This time slot is no longer available",
          variant: "destructive"
        });
        return;
      }

      // Create the reservation
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
        description: `Your ${isPrivate ? 'private' : 'shared'} booking for ${classroom.name} has been confirmed. Please check in within the allowed time window.`
      });

      onSuccess();
      onClose();
      setEmail('');
      setStartHour(9);
      setDuration(1);
      setIsPrivate(false);
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Book {classroom?.name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-gray-700 font-medium">University Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.name@alumni.esade.edu"
              required
              className="mt-1 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label htmlFor="private" className="text-gray-700">
              Private booking (exclusive use)
            </Label>
          </div>

          <div>
            <Label htmlFor="startHour" className="text-gray-700 font-medium">Start Time</Label>
            <Select 
              value={startHour.toString()} 
              onValueChange={(value) => setStartHour(parseInt(value))}
              disabled={availableHours.length === 0}
            >
              <SelectTrigger className="mt-1 border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableHours.map(hour => (
                  <SelectItem key={hour} value={hour.toString()}>
                    {hour}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableHours.length === 0 && (
              <p className="text-sm text-red-600 mt-1">No available time slots</p>
            )}
          </div>

          <div>
            <Label htmlFor="duration" className="text-gray-700 font-medium">Duration (hours)</Label>
            <Select 
              value={duration.toString()} 
              onValueChange={(value) => setDuration(parseInt(value))}
              disabled={availableDurations.length === 0}
            >
              <SelectTrigger className="mt-1 border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableDurations.map(dur => (
                  <SelectItem key={dur} value={dur.toString()}>
                    {dur} hour{dur > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableDurations.length === 0 && (
              <p className="text-sm text-red-600 mt-1">No available durations</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 border-gray-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || availableHours.length === 0 || availableDurations.length === 0} 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
