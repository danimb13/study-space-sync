// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://uaeflnzanilniafranqg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWZsbnphbmlsbmlhZnJhbnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNDQwNTIsImV4cCI6MjA2NTkyMDA1Mn0.GhSLdfnQCZnCn7I6FhwQaYDHxcb-qIDA-WCGT2_5cK4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);