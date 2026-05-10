import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://wsgcvuphdpstugduekxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZ2N2dXBoZHBzdHVnZHVla3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDYyODUsImV4cCI6MjA5Mzk4MjI4NX0.lsjUL1fWOKRlbD5IowwyXCjg0rB7tq_aIiCumQOhRLI'
)
