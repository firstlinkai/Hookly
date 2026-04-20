import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://excmfzlrnzetxkygfmao.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Y21memxybnpldHhreWdmbWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjQyMTAsImV4cCI6MjA5MTI0MDIxMH0.H__TZOxNoVJSQzoJgTbM-jCXrLXkPLqh7e-9hvG1obE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
