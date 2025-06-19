
-- Create the classrooms table
CREATE TABLE public.classrooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the 5 rooms
INSERT INTO public.classrooms (name, capacity) VALUES
  ('Room A', 8),
  ('Room B', 6),
  ('Room C', 10),
  ('Room D', 4),
  ('Room E', 12);

-- Create the reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'checked_in', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_reservations_classroom_id ON public.reservations(classroom_id);
CREATE INDEX idx_reservations_start_time ON public.reservations(start_time);
CREATE INDEX idx_reservations_end_time ON public.reservations(end_time);
CREATE INDEX idx_reservations_status ON public.reservations(status);

-- Enable Row Level Security (but make it public since no auth required)
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Everyone can view classrooms" ON public.classrooms FOR SELECT USING (true);
CREATE POLICY "Everyone can view reservations" ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Everyone can create reservations" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Everyone can update reservations" ON public.reservations FOR UPDATE USING (true);

-- Function to automatically expire reservations
CREATE OR REPLACE FUNCTION public.expire_old_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.reservations 
  SET status = 'expired', updated_at = now()
  WHERE status = 'reserved' 
    AND start_time + INTERVAL '15 minutes' < now();
END;
$$;

-- Function to check if a reservation can be made
CREATE OR REPLACE FUNCTION public.can_make_reservation(
  p_classroom_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_is_private BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  classroom_capacity INTEGER;
  current_bookings INTEGER;
  has_private_booking BOOLEAN;
BEGIN
  -- Get classroom capacity
  SELECT capacity INTO classroom_capacity 
  FROM public.classrooms 
  WHERE id = p_classroom_id;
  
  -- Check for overlapping private bookings
  SELECT EXISTS(
    SELECT 1 FROM public.reservations r
    WHERE r.classroom_id = p_classroom_id
    AND r.status IN ('reserved', 'checked_in')
    AND r.is_private = true
    AND (
      (r.start_time <= p_start_time AND r.end_time > p_start_time) OR
      (r.start_time < p_end_time AND r.end_time >= p_end_time) OR
      (r.start_time >= p_start_time AND r.end_time <= p_end_time)
    )
  ) INTO has_private_booking;
  
  -- If requesting private booking or there's already a private booking, can't book
  IF p_is_private OR has_private_booking THEN
    RETURN NOT has_private_booking;
  END IF;
  
  -- Count current shared bookings for the time slot
  SELECT COUNT(*) INTO current_bookings
  FROM public.reservations r
  WHERE r.classroom_id = p_classroom_id
  AND r.status IN ('reserved', 'checked_in')
  AND r.is_private = false
  AND (
    (r.start_time <= p_start_time AND r.end_time > p_start_time) OR
    (r.start_time < p_end_time AND r.end_time >= p_end_time) OR
    (r.start_time >= p_start_time AND r.end_time <= p_end_time)
  );
  
  -- Can book if under capacity
  RETURN current_bookings < classroom_capacity;
END;
$$;

-- Enable realtime for both tables
ALTER TABLE public.classrooms REPLICA IDENTITY FULL;
ALTER TABLE public.reservations REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.classrooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
