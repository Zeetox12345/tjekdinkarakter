// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://znutzxzuanopnoxlhejk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudXR6eHp1YW5vcG5veGxoZWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NjUwNjIsImV4cCI6MjA1NTE0MTA2Mn0.78sAiBkgv3JUIq_dfNDLkYUKOoeZrXbBjIjfrYx5sWY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);