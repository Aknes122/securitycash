import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rttqkimlaavooltnelma.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dHFraW1sYWF2b29sdG5lbG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxODAzNjcsImV4cCI6MjA4Mzc1NjM2N30.7prMbq7QeBCFhy2NuYBk6epsgLlxRo4ybKhlsUw74Iw';

export const supabase = createClient(supabaseUrl, supabaseKey);
