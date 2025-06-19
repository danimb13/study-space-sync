
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Reservation, Classroom } from '@/types/booking';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

const CheckIn = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [classroom, setClassroom] = useState<Classroom | null>(null);

  const roomName = roomId?.replace('room-', 'Room ').replace('-', ' ').split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  useEffect(() => {
    const fetchClassroom = async () => {
      if (!roomName) return;
      
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('name', roomName)
        .single();
      
      if (!error && data) {
        setClassroom(data);
      }
    };

    fetchClassroom();
  }, [roomName]);

  const validateEmail = (email: string) => {
    return email.endsWith('@alumni.esade.edu');
  };

  const isWithinCheckInWindow = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const fiveMinutesBefore = new Date(start.getTime() - 5 * 60 * 1000);
    const fifteenMinutesAfter = new Date(start.getTime() + 15 * 60 * 1000);
    
    return now >= fiveMinutesBefore && now <= fifteenMinutesAfter;
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please use your university email ending with @alumni.esade.edu",
        variant: "destructive"
      });
      return;
    }

    if (!classroom) {
      toast({
        title: "Room Not Found",
        description: "Invalid room for check-in",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // First expire old reservations
      await supabase.rpc('expire_old_reservations');

      // Find the reservation
      const { data: reservations, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('classroom_id', classroom.id)
        .eq('student_email', email)
        .eq('status', 'reserved')
        .order('start_time', { ascending: true });

      if (fetchError) throw fetchError;

      if (!reservations || reservations.length === 0) {
        toast({
          title: "No Reservation Found",
          description: "No active reservation found for this email and room",
          variant: "destructive"
        });
        return;
      }

      // Find the reservation that's within check-in window
      const validReservation = reservations.find(r => isWithinCheckInWindow(r.start_time));

      if (!validReservation) {
        const upcomingReservation = reservations.find(r => new Date(r.start_time) > new Date());
        if (upcomingReservation) {
          const startTime = new Date(upcomingReservation.start_time);
          const checkInStart = new Date(startTime.getTime() - 5 * 60 * 1000);
          
          toast({
            title: "Check-in Not Available Yet",
            description: `You can check in starting from ${checkInStart.toLocaleTimeString()} (5 minutes before your booking)`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Check-in Window Expired",
            description: "The check-in window has expired for all your reservations in this room",
            variant: "destructive"
          });
        }
        return;
      }

      // Update reservation status to checked_in
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ 
          status: 'checked_in',
          updated_at: new Date().toISOString()
        })
        .eq('id', validReservation.id);

      if (updateError) throw updateError;

      setReservation(validReservation);
      
      toast({
        title: "Check-in Successful!",
        description: `You've successfully checked into ${roomName}`,
      });

    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: "Check-in Failed",
        description: "There was an error during check-in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (reservation) {
    const startTime = new Date(reservation.start_time);
    const endTime = new Date(reservation.end_time);
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">Check-in Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">{roomName}</h3>
              <p className="text-green-700">
                {startTime.toLocaleTimeString()} - {endTime.toLocaleTimeString()}
              </p>
              <p className="text-sm text-green-600 mt-2">
                {reservation.is_private ? 'Private Booking' : 'Shared Booking'}
              </p>
            </div>
            <p className="text-gray-600">
              Enjoy your study session! Your booking is now active.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Check-in to {roomName}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This room reservation must be confirmed within the allowed time window: from 5 minutes before until 15 minutes after the booked time. If no check-in is made, the room will become available for others. Please enter your university email to confirm your booking.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleCheckIn} className="space-y-4">
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

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Checking in...' : 'Check In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckIn;
