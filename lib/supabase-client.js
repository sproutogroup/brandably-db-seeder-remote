const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
 "https://mhkvikuzfhnivsuxqgxi.supabase.co",
 "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oa3Zpa3V6ZmhuaXZzdXhxZ3hpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE1NDE3MywiZXhwIjoyMDc0NzMwMTczfQ.sLtD_hMogGlX2bR8mnJl1AkpX0UuBS-mDkBODLEd0ys"
);

module.exports = { supabase };
