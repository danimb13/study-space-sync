
-- Add building and room_type columns to classrooms table
ALTER TABLE public.classrooms 
ADD COLUMN building TEXT,
ADD COLUMN room_type TEXT DEFAULT 'meeting_room';

-- Update existing rooms with sample data
UPDATE public.classrooms 
SET building = CASE 
  WHEN name LIKE '%A%' THEN 'Building A'
  WHEN name LIKE '%B%' THEN 'Building B'
  WHEN name LIKE '%C%' THEN 'Building C'
  ELSE 'Main Building'
END,
room_type = CASE 
  WHEN name LIKE '%Computer%' OR name LIKE '%Lab%' THEN 'computer_room'
  WHEN name LIKE '%Conference%' THEN 'conference_room'
  WHEN name LIKE '%Study%' THEN 'study_room'
  ELSE 'meeting_room'
END;

-- Make building and room_type not null after setting values
ALTER TABLE public.classrooms 
ALTER COLUMN building SET NOT NULL,
ALTER COLUMN room_type SET NOT NULL;
