const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://uaeflnzanilniafranqg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWZsbnphbmlsbmlhZnJhbnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNDQwNTIsImV4cCI6MjA2NTkyMDA1Mn0.GhSLdfnQCZnCn7I6FhwQaYDHxcb-qIDA-WCGT2_5cK4";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const rooms = [
  { id: '2d6dc0e7-dbc7-4bc5-b77e-84ca9310e01b', name: 'Room C' },
  { id: '8de7d00a-523b-43f7-87b4-b31bc7e3435e', name: 'Room A' },
  { id: '950bc162-bb69-4258-a4ff-fec65c0b7038', name: 'Room E' },
  { id: '977328d8-ba29-4914-994c-bdd8183fca84', name: 'Room D' },
  { id: 'efbb6761-4457-4d72-a775-cd1f315f8a07', name: 'Room B' },
];

const demoReservations = [
  // Room C (llena, capacidad supón 3)
  ...[8, 9, 10].map(hour => ({
    classroom_id: rooms[0].id,
    student_email: `full${hour}a@alumni.esade.edu`,
    start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, hour, 0, 0).toISOString(),
    end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, hour + 1, 0, 0).toISOString(),
    is_private: false
  })),
  ...[8, 9, 10].map(hour => ({
    classroom_id: rooms[0].id,
    student_email: `full${hour}b@alumni.esade.edu`,
    start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, hour, 0, 0).toISOString(),
    end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, hour + 1, 0, 0).toISOString(),
    is_private: false
  })),
  ...[8, 9, 10].map(hour => ({
    classroom_id: rooms[0].id,
    student_email: `full${hour}c@alumni.esade.edu`,
    start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, hour, 0, 0).toISOString(),
    end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, hour + 1, 0, 0).toISOString(),
    is_private: true
  })),

  // Room A (a medias)
  {
    classroom_id: rooms[1].id,
    student_email: 'media1@alumni.esade.edu',
    start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, 12, 0, 0).toISOString(),
    end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, 13, 0, 0).toISOString(),
    is_private: false
  },
  {
    classroom_id: rooms[1].id,
    student_email: 'media2@alumni.esade.edu',
    start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, 12, 0, 0).toISOString(),
    end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, 13, 0, 0).toISOString(),
    is_private: false
  },
  {
    classroom_id: rooms[1].id,
    student_email: 'media3@alumni.esade.edu',
    start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, 15, 0, 0).toISOString(),
    end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, 16, 0, 0).toISOString(),
    is_private: true
  },

  // Room E (libre, solo una reserva)
  {
    classroom_id: rooms[2].id,
    student_email: 'free1@alumni.esade.edu',
    start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, 18, 0, 0).toISOString(),
    end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 19, 19, 0, 0).toISOString(),
    is_private: false
  },

  // Room D (privada bloqueando toda la tarde)
  {
    classroom_id: rooms[3].id,
    student_email: 'privadad@alumni.esade.edu',
    start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 14, 0, 0).toISOString(),
    end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 20, 0, 0).toISOString(),
    is_private: true
  },

  // Room B (varias shared y una privada)
  {
    classroom_id: rooms[4].id,
    student_email: 'sharedb1@alumni.esade.edu',
    start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 10, 0, 0).toISOString(),
    end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 11, 0, 0).toISOString(),
    is_private: false
  },
  {
    classroom_id: rooms[4].id,
    student_email: 'sharedb2@alumni.esade.edu',
    start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 10, 0, 0).toISOString(),
    end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 11, 0, 0).toISOString(),
    is_private: false
  },
  {
    classroom_id: rooms[4].id,
    student_email: 'privateb@alumni.esade.edu',
    start_time: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 12, 0, 0).toISOString(),
    end_time: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 14, 0, 0).toISOString(),
    is_private: true
  },
];

async function main() {
  for (const reservation of demoReservations) {
    const { error } = await supabase.from('reservations').insert(reservation);
    if (error) {
      console.error('Error inserting reservation:', error, reservation);
    } else {
      console.log('Inserted reservation:', reservation);
    }
  }
  console.log('Demo reservations inserted.');
}

main().catch(console.error); 