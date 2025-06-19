
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Classroom } from '@/types/booking';

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

  const validateEmail = (email: string) => {
    return email.endsWith('@alumni.esade.edu');
  };

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

    if (duration > 3) {
      toast({
        title: "Invalid Duration",
        description: "Maximum booking duration is 3 hours",
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

      // Check if reservation is possible
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
          description: "This time slot is not available for the selected booking type",
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

  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
  const durations = [1, 2, 3];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book {classroom?.name}</DialogTitle>
        </DialogHeader>
        
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
            />
          </div>

          <div>
            <Label htmlFor="startHour">Start Time</Label>
            <Select value={startHour.toString()} onValueChange={(value) => setStartHour(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hours.map(hour => (
                  <SelectItem key={hour} value={hour.toString()}>
                    {hour}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="duration">Duration (hours)</Label>
            <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map(dur => (
                  <SelectItem key={dur} value={dur.toString()}>
                    {dur} hour{dur > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
            <Label htmlFor="private">Private booking (exclusive use)</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
