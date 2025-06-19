
export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  created_at: string;
}

export interface Reservation {
  id: string;
  classroom_id: string;
  student_email: string;
  start_time: string;
  end_time: string;
  is_private: boolean;
  status: 'reserved' | 'checked_in' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface RoomStatus {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  status: 'available' | 'partial' | 'private' | 'full';
  nextAvailable?: string;
}
