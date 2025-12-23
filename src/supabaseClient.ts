import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual values from Supabase Settings -> API
const supabaseUrl = 'https://qwifaauejfmhuhyyjius.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aWZhYXVlamZtaHVoeXlqaXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMDE1MTYsImV4cCI6MjA4MTY3NzUxNn0.sm0OYygWgRPUvUuyb3R1lC8KXD0C9l1tJ5PduUHHzOU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
