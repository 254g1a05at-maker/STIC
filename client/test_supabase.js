import { createClient } from '@supabase/supabase-js';

const url = 'https://ymmomauxfwnbqkmuxncw.supabase.co';
const key = 'sb_publishable_t-RyKUjbY2rllypPK_PeUw_ibvV3djU';
const sb = createClient(url, key);

async function checkMore() {
  const { data: s, error: sErr } = await sb.from('settings').select('*');
  console.log('settings table:', { s, sErr });

  const { data: users, error: uErr } = await sb.from('users').select('id, username, role');
  console.log('users table:', { count: users?.length, uErr });

  // Fix department 1 description
  await sb.from('departments').update({
    description: 'Crafts official club reports, newsletters, event write-ups, certificates, and archival logs.',
    lead_member_id: null
  }).eq('id', 1);

  // Check what members exist
  const { data: members, count } = await sb.from('club_members').select('id, full_name, college_id, position, department_id', { count: 'exact' });
  console.log('club_members count:', count, 'sample:', members?.slice(0, 5));
}

checkMore();
