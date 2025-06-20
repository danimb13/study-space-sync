
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
import { CheckCircle, AlertCircle, Clock, MapPin, Building } from 'lucide-react';

const CheckIn = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [classroom, setClassroom] = useState<Classroom | null>(null);

  // Convert roomId to proper room name (e.g., "room-a" -> "Room A")
  const getRoomNameFromId = (id: string | undefined) => {
    if (!id) return '';
    
    // Handle different formats like "room-a", "room-b", etc.
    const parts = id.split('-');
    if (parts.length >= 2) {
      const roomLetter = parts[1].toUpperCase();
      return `Room ${roomLetter}`;
    }
    
    return id;
  };

  const roomName = getRoomNameFromId(roomId);

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
    const fetchClassroom = async () => {
      if (!roomName) return;
      
      console.log('Looking for classroom with name:', roomName);
      
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('name', roomName)
        .single();
      
      if (error) {
        console.error('Error fetching classroom:', error);
        toast({
          title: "Room Not Found",
          description: `Could not find room "${roomName}". Please check the URL.`,
          variant: "destructive"
        });
      } else if (data) {
        console.log('Found classroom:', data);
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

      const typedReservation: Reservation = {
        ...validReservation,
        status: 'checked_in' as const
      };

      setReservation(typedReservation);
      
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

  if (reservation && classroom) {
    const startTime = new Date(reservation.start_time);
    const endTime = new Date(reservation.end_time);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <CardTitle className="text-2xl">Check-in Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center p-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 text-lg">{roomName}</h3>
              <div className="space-y-1 text-sm text-green-700 mt-2">
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{classroom.building}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>{getRoomTypeDisplay(classroom.room_type)}</span>
                </div>
              </div>
              <p className="text-green-700 font-medium mt-3">
                {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <Clock className="w-16 h-16 mx-auto mb-4" />
          <CardTitle className="text-2xl">Check-in to {roomName || 'Room'}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {classroom && (
            <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="space-y-1 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{classroom.building}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>{getRoomTypeDisplay(classroom.room_type)}</span>
                </div>
              </div>
            </div>
          )}

          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              This room reservation must be confirmed within the allowed time window: from 5 minutes before until 15 minutes after the booked time. If no check-in is made, the room will become available for others. Please enter your university email to confirm your booking.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleCheckIn} className="space-y-4">
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

            <Button 
              type="submit" 
              disabled={isLoading || !classroom} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
            >
              {isLoading ? 'Checking in...' : 'Check In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckIn;
