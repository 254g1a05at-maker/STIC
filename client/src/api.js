import { getSupabaseClient, isSupabaseConfigured } from './supabase';

// STIC Client API Client

const API_BASE = '/api';

export const authState = {
  getToken: () => localStorage.getItem('stic_token'),
  setToken: (token) => localStorage.setItem('stic_token', token),
  removeToken: () => localStorage.removeItem('stic_token'),
  getUser: () => {
    try {
      const u = localStorage.getItem('stic_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('stic_user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('stic_user'),
  clear: () => {
    localStorage.removeItem('stic_token');
    localStorage.removeItem('stic_user');
  },
  logout: () => {
    authState.removeToken();
    authState.removeUser();
    window.location.reload();
  }
};

/**
 * High-performance browser-side image compressor for posters and photos
 * Resizes large photos to optimal web dimensions (max 1200px) and compresses to ~70-120KB JPEG Data URL.
 * Ensures Supabase PostgREST never fails with 413 Payload Too Large.
 */
async function compressImageFile(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
  if (!file) return null;
  if (typeof window === 'undefined' || typeof FileReader === 'undefined') return null;
  if (file.type && !file.type.startsWith('image/')) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result || null);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function handleSupabaseRequest(endpoint, options = {}) {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    const method = (options.method || 'GET').toUpperCase();

    // 1. Members endpoint
    if (endpoint.startsWith('/members')) {
      // 1A. Single Member GET: /members/:id
      const singleMatch = endpoint.match(/^\/members\/(\d+)$/);
      if (singleMatch && method === 'GET') {
        const id = Number(singleMatch[1]);
        let { data, error } = await sb.from('club_members').select('*, departments(name, icon)').eq('id', id).single();
        if (error) {
          const res2 = await sb.from('club_members').select('*, departments(name, icon)').eq('college_id', String(id)).single();
          if (res2.data) { data = res2.data; error = null; }
        }
        if (error || !data) return null;
        return {
          success: true,
          data: {
            ...data,
            department_name: data.departments?.name || null,
            department_icon: data.departments?.icon || null
          }
        };
      }

      // 1B. List Members GET: /members or /members?...
      if (method === 'GET') {
        let query = sb.from('club_members').select('*, departments(name, icon)');

        if (endpoint.includes('?')) {
          const queryStr = endpoint.substring(endpoint.indexOf('?') + 1);
          const params = new URLSearchParams(queryStr);

          const section = params.get('section');
          if (section) {
            query = query.or(`section.eq.${section},notes.ilike.%Section: ${section}%,branch.ilike.%(${section})%`);
          }

          const deptId = params.get('department_id');
          if (deptId) {
            if (deptId === 'unassigned') {
              query = query.is('department_id', null);
            } else if (!isNaN(Number(deptId))) {
              query = query.eq('department_id', Number(deptId));
            }
          }

          const year = params.get('year');
          if (year) query = query.eq('year', year);

          const status = params.get('status');
          if (status) query = query.eq('status', status);

          const role = params.get('role') || params.get('position');
          if (role) query = query.ilike('position', `%${role}%`);

          const search = params.get('search');
          if (search && search.trim()) {
            const s = search.trim();
            query = query.or(`full_name.ilike.%${s}%,college_id.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%,position.ilike.%${s}%,section.ilike.%${s}%`);
          }

          const sortBy = params.get('sort_by');
          const order = params.get('order');
          const isAsc = order !== 'DESC';

          if (sortBy === 'year') {
            query = query.order('year', { ascending: isAsc });
          } else if (sortBy === 'joining_date') {
            query = query.order('joining_date', { ascending: isAsc });
          } else if (sortBy === 'name_desc') {
            query = query.order('full_name', { ascending: false });
          } else {
            query = query.order('full_name', { ascending: isAsc });
          }
        } else {
          query = query.order('full_name', { ascending: true });
        }

        const { data, error } = await query;
        if (error) {
          console.warn('[Supabase GET Members Error]', error);
          return null;
        }

        const formatted = (data || []).map(m => ({
          ...m,
          department_name: m.departments?.name || null,
          department_icon: m.departments?.icon || null
        }));

        return { success: true, count: formatted.length, data: formatted };
      }

      // 1C. Create Member POST: /members
      if (method === 'POST') {
        let row = {};
        if (options.body instanceof FormData) {
          options.body.forEach((val, key) => {
            if (key !== 'avatar') row[key] = val;
          });
        } else if (typeof options.body === 'string') {
          try { row = JSON.parse(options.body); } catch (e) { row = {}; }
        } else if (options.body) {
          row = { ...options.body };
        }

        // Map profile_photo_url to profile_photo column for Supabase schema
        if ('profile_photo_url' in row) {
          if (row.profile_photo_url) {
            row.profile_photo = row.profile_photo_url;
          }
          delete row.profile_photo_url;
        }

        // Support image file upload conversion to Data URL for Supabase if provided
        if (options.body instanceof FormData && typeof FileReader !== 'undefined') {
          const avatarVal = options.body.get('avatar');
          if (avatarVal && typeof avatarVal === 'object' && avatarVal.size > 0) {
            try {
              const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(avatarVal);
              });
              if (dataUrl) row.profile_photo = dataUrl;
            } catch (e) {}
          }
        }

        delete row.id;
        delete row.created_at;
        delete row.updated_at;
        delete row.departments;
        delete row.department_name;
        delete row.department_icon;
        delete row.programs_coordinated_count;
        delete row.avatar;

        if (!row.full_name || !row.college_id || !row.email) {
          throw new Error('Full Name, College ID, and Email are required.');
        }

        row.college_id = row.college_id.trim();
        row.full_name = row.full_name.trim();
        row.email = row.email.trim();
        row.phone = row.phone ? row.phone.trim() : null;
        row.year = row.year || '2nd Year';
        row.branch = row.branch || 'Computer Science & Engineering';
        row.section = row.section ? row.section.trim() : null;
        row.position = row.position ? row.position.trim() : 'Club Member';
        row.status = row.status || 'Active';
        row.notes = row.notes ? row.notes.trim() : null;
        row.joining_date = row.joining_date || new Date().toISOString().split('T')[0];

        if (row.department_id && row.department_id !== 'unassigned' && row.department_id !== 'null' && !isNaN(Number(row.department_id))) {
          row.department_id = Number(row.department_id);
        } else {
          row.department_id = null;
        }

        // Whitelist exact club_members columns supported by Supabase PostgreSQL schema
        const allowedMemberCols = new Set([
          'full_name', 'college_id', 'email', 'phone', 'year', 'branch',
          'section', 'position', 'department_id', 'profile_photo',
          'joining_date', 'status', 'notes', 'is_demo', 'created_by', 'updated_by'
        ]);
        const cleanRow = {};
        for (const [k, v] of Object.entries(row)) {
          if (allowedMemberCols.has(k)) {
            cleanRow[k] = v;
          }
        }

        const { data, error } = await sb.from('club_members').insert([cleanRow]).select('*, departments(name, icon)').single();
        if (error) throw new Error(error.message);

        return {
          success: true,
          message: 'Member added successfully to Supabase cloud database.',
          data: {
            ...data,
            department_name: data?.departments?.name || null,
            department_icon: data?.departments?.icon || null
          }
        };
      }

      // 1D. Update Member PUT: /members/:id
      if (method === 'PUT') {
        const idMatch = endpoint.match(/\/members\/(\d+)/);
        if (idMatch) {
          const memberId = Number(idMatch[1]);
          let row = {};
          if (options.body instanceof FormData) {
            options.body.forEach((val, key) => {
              if (key !== 'avatar') row[key] = val;
            });
          } else if (typeof options.body === 'string') {
            try { row = JSON.parse(options.body); } catch (e) { row = {}; }
          } else if (options.body) {
            row = { ...options.body };
          }

          // Map profile_photo_url to profile_photo column for Supabase schema
          if ('profile_photo_url' in row) {
            if (row.profile_photo_url) {
              row.profile_photo = row.profile_photo_url;
            }
            delete row.profile_photo_url;
          }

          // Support image file upload conversion to Data URL for Supabase if provided
          if (options.body instanceof FormData && typeof FileReader !== 'undefined') {
            const avatarVal = options.body.get('avatar');
            if (avatarVal && typeof avatarVal === 'object' && avatarVal.size > 0) {
              try {
                const dataUrl = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result);
                  reader.onerror = () => resolve(null);
                  reader.readAsDataURL(avatarVal);
                });
                if (dataUrl) row.profile_photo = dataUrl;
              } catch (e) {}
            }
          }

          delete row.id;
          delete row.created_at;
          delete row.updated_at;
          delete row.departments;
          delete row.department_name;
          delete row.department_icon;
          delete row.programs_coordinated_count;
          delete row.avatar;

          if (row.college_id) row.college_id = row.college_id.trim();
          if (row.full_name) row.full_name = row.full_name.trim();
          if (row.email) row.email = row.email.trim();
          if ('phone' in row) row.phone = row.phone ? row.phone.trim() : null;
          if ('section' in row) row.section = row.section ? row.section.trim() : null;
          if ('position' in row) row.position = row.position ? row.position.trim() : 'Club Member';
          if ('status' in row) row.status = row.status ? row.status.trim() : 'Active';
          if ('notes' in row) row.notes = row.notes ? row.notes.trim() : null;

          if ('department_id' in row) {
            if (row.department_id && row.department_id !== 'unassigned' && row.department_id !== 'null' && !isNaN(Number(row.department_id))) {
              row.department_id = Number(row.department_id);
            } else {
              row.department_id = null;
            }
          }
          row.updated_at = new Date().toISOString();

          // Whitelist exact club_members columns supported by Supabase PostgreSQL schema
          const allowedMemberCols = new Set([
            'full_name', 'college_id', 'email', 'phone', 'year', 'branch',
            'section', 'position', 'department_id', 'profile_photo',
            'joining_date', 'status', 'notes', 'is_demo', 'created_by', 'updated_by'
          ]);
          const cleanRow = {};
          for (const [k, v] of Object.entries(row)) {
            if (allowedMemberCols.has(k)) {
              cleanRow[k] = v;
            }
          }

          // 1. Try update by numeric ID
          let { data, error } = await sb.from('club_members').update(cleanRow).eq('id', memberId).select('*, departments(name, icon)').single();

          // 2. Fallback to college_id if id mismatch
          if (error && cleanRow.college_id) {
            const res2 = await sb.from('club_members').update(cleanRow).eq('college_id', cleanRow.college_id).select('*, departments(name, icon)').single();
            if (!res2.error && res2.data) {
              data = res2.data;
              error = null;
            }
          }

          if (error) throw new Error(error.message);

          return {
            success: true,
            message: 'Member updated successfully in Supabase cloud database.',
            data: {
              ...data,
              department_name: data?.departments?.name || null,
              department_icon: data?.departments?.icon || null
            }
          };
        }
      }

      // 1E. Delete Member DELETE: /members/:id
      if (method === 'DELETE') {
        const idMatch = endpoint.match(/\/members\/(\d+)/);
        if (idMatch) {
          const memberId = Number(idMatch[1]);
          const { error } = await sb.from('club_members').delete().eq('id', memberId);
          if (error) throw new Error(error.message);
          return { success: true, message: 'Member deleted from Supabase cloud database.' };
        }
      }
    }

    // 2. Departments endpoint
    if (endpoint.startsWith('/departments')) {
      if (method === 'GET') {
        const { data, error } = await sb.from('departments').select('*').order('name', { ascending: true });
        if (!error && data) return { success: true, count: data.length, data };
      }
    }

    // 3. Programs endpoint
    if (endpoint.startsWith('/programs')) {
      // 3A. Single Program GET: /programs/:id
      const singleProgMatch = endpoint.match(/^\/programs\/(\d+)$/);
      if (singleProgMatch && method === 'GET') {
        const programId = Number(singleProgMatch[1]);
        const { data: program, error } = await sb.from('programs').select('*').eq('id', programId).single();
        if (error || !program) return null;

        // Fetch coordinators with club_members details
        const { data: coords } = await sb
          .from('program_coordinators')
          .select('id, role_title, member_id, club_members(id, full_name, college_id, email, phone, year, branch, profile_photo)')
          .eq('program_id', programId);

        const coordinators = (coords || []).map(c => ({
          id: c.member_id,
          member_id: c.member_id,
          full_name: c.club_members?.full_name || 'Member',
          college_id: c.club_members?.college_id || '',
          email: c.club_members?.email || '',
          phone: c.club_members?.phone || '',
          year: c.club_members?.year || '',
          branch: c.club_members?.branch || '',
          profile_photo: c.club_members?.profile_photo || null,
          role_title: c.role_title || 'Coordinator'
        }));

        // Fetch related finance, sponsors, photos, videos, documents safely
        let totalIncome = 0;
        let totalExpense = 0;
        const incomeList = [];
        const expenseList = [];
        let transactions = [];
        let sponsors = [];
        let photos = [];
        let videos = [];
        let documents = [];

        try {
          const { data: txs } = await sb.from('transactions').select('*').eq('program_id', programId).order('date', { ascending: false });
          if (txs) {
            transactions = txs;
            txs.forEach(t => {
              const amt = Number(t.amount || 0);
              if (t.type === 'Income') {
                totalIncome += amt;
                incomeList.push(t);
              } else {
                totalExpense += amt;
                expenseList.push(t);
              }
            });
          }
        } catch (e) {}

        try {
          const { data: sps } = await sb.from('sponsors').select('*').eq('program_id', programId);
          if (sps) sponsors = sps;
        } catch (e) {}

        try {
          const { data: phs } = await sb.from('photos').select('*').eq('program_id', programId).order('id', { ascending: false });
          if (phs && phs.length > 0) photos = phs;
        } catch (e) {}

        // Fallback: If Supabase photos table is absent or empty, check local backend
        if (photos.length === 0) {
          try {
            const codeParam = program.program_code ? `&program_code=${encodeURIComponent(program.program_code)}` : '';
            const resLocal = await fetch(`${API_BASE}/photos?program_id=${programId}${codeParam}`).then(r => r.json());
            if (resLocal && resLocal.data && resLocal.data.length > 0) {
              photos = resLocal.data;
            }
          } catch (e) {}
        }

        try {
          const { data: vds } = await sb.from('videos').select('*').eq('program_id', programId).order('id', { ascending: false });
          if (vds && vds.length > 0) videos = vds;
        } catch (e) {}

        if (videos.length === 0) {
          try {
            const resLocal = await fetch(`${API_BASE}/videos?program_id=${programId}`).then(r => r.json());
            if (resLocal && resLocal.data && resLocal.data.length > 0) {
              videos = resLocal.data;
            }
          } catch (e) {}
        }

        try {
          const { data: dcs } = await sb.from('documents').select('*').eq('program_id', programId).order('id', { ascending: false });
          if (dcs && dcs.length > 0) documents = dcs;
        } catch (e) {}

        if (documents.length === 0) {
          try {
            const resLocal = await fetch(`${API_BASE}/documents?program_id=${programId}`).then(r => r.json());
            if (resLocal && resLocal.data && resLocal.data.length > 0) {
              documents = resLocal.data;
            }
          } catch (e) {}
        }

        const totalSponsorship = sponsors.reduce((acc, s) => acc + Number(s.amount || 0), 0);

        return {
          success: true,
          data: {
            ...program,
            coordinators,
            photos,
            videos,
            documents,
            finance: {
              total_income: totalIncome,
              total_expense: totalExpense,
              balance: totalIncome - totalExpense,
              transactions,
              income_list: incomeList,
              expense_list: expenseList
            },
            sponsors: {
              list: sponsors,
              total_amount: totalSponsorship
            },
            social_media: []
          }
        };
      }

      // 3B. List Programs GET: /programs or /programs?...
      if (!endpoint.match(/^\/programs\/\d+/) && method === 'GET') {
        let query = sb.from('programs').select('*, program_coordinators(id, role_title, member_id, club_members(id, full_name, college_id, email, phone, profile_photo))');

        if (endpoint.includes('?')) {
          const queryStr = endpoint.substring(endpoint.indexOf('?') + 1);
          const params = new URLSearchParams(queryStr);

          const status = params.get('status');
          if (status) query = query.eq('status', status);

          const programType = params.get('program_type');
          if (programType) query = query.eq('program_type', programType);

          const year = params.get('year');
          if (year) {
            query = query.gte('program_date', `${year}-01-01`).lte('program_date', `${year}-12-31`);
          }

          const dateFrom = params.get('date_from');
          if (dateFrom) query = query.gte('program_date', dateFrom);

          const dateTo = params.get('date_to');
          if (dateTo) query = query.lte('program_date', dateTo);

          const search = params.get('search');
          if (search && search.trim()) {
            const s = search.trim();
            query = query.or(`name.ilike.%${s}%,program_code.ilike.%${s}%,venue.ilike.%${s}%,description.ilike.%${s}%`);
          }
        }

        query = query.order('program_date', { ascending: false }).order('id', { ascending: false });

        const [{ data, error }, { count: totalConducted }] = await Promise.all([
          query,
          sb.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'Completed')
        ]);

        if (error) {
          console.warn('[Supabase GET Programs Error]', error);
          return null;
        }

        const formatted = (data || []).map(p => {
          const coordinators = (p.program_coordinators || []).map(pc => ({
            member_id: pc.member_id,
            role_title: pc.role_title || 'Coordinator',
            full_name: pc.club_members?.full_name || '',
            college_id: pc.club_members?.college_id || '',
            email: pc.club_members?.email || '',
            phone: pc.club_members?.phone || '',
            profile_photo: pc.club_members?.profile_photo || null
          }));
          return {
            ...p,
            total_balance: p.total_balance || 0,
            coordinators
          };
        });

        return {
          success: true,
          count: formatted.length,
          total_programs: formatted.length,
          total_conducted: totalConducted || 0,
          data: formatted
        };
      }

      // 3C. Create Program POST: /programs
      if (endpoint === '/programs' && method === 'POST') {
        let row = {};
        let coordinatorIds = [];

        if (options.body instanceof FormData) {
          options.body.forEach((val, key) => {
            if (key === 'coordinator_ids') {
              try {
                coordinatorIds = typeof val === 'string' ? JSON.parse(val) : val;
              } catch (e) {
                coordinatorIds = String(val).split(',').map(s => s.trim()).filter(Boolean);
              }
            } else if (key !== 'poster') {
              row[key] = val;
            }
          });
        } else if (typeof options.body === 'string') {
          try {
            row = JSON.parse(options.body);
            if (row.coordinator_ids) coordinatorIds = row.coordinator_ids;
          } catch (e) { row = {}; }
        } else if (options.body) {
          row = { ...options.body };
          if (row.coordinator_ids) coordinatorIds = row.coordinator_ids;
        }

        // Support poster file conversion to optimized Data URL for Supabase
        let posterDataUrl = null;
        if (options.body instanceof FormData) {
          const posterFile = options.body.get('poster');
          if (posterFile && typeof posterFile === 'object' && posterFile.size > 0) {
            try {
              posterDataUrl = await compressImageFile(posterFile);
            } catch (e) {}
          }
        }

        if (!row.name || !row.program_date) {
          throw new Error('Program name and date are required.');
        }

        // Auto-generate program code if empty or whitespace
        if (!row.program_code || !row.program_code.trim()) {
          const currentYear = new Date().getFullYear();
          const prefix = `STIC-${currentYear}-`;
          const { data: lastRows } = await sb.from('programs')
            .select('program_code')
            .like('program_code', `${prefix}%`)
            .order('program_code', { ascending: false })
            .limit(20);

          let maxNum = 0;
          if (lastRows && lastRows.length > 0) {
            lastRows.forEach(r => {
              if (r.program_code) {
                const parts = r.program_code.split('-');
                const n = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(n) && n > maxNum) maxNum = n;
              }
            });
          }
          row.program_code = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
        } else {
          row.program_code = row.program_code.trim();
        }

        // Ensure mirrored request to Express gets the exact same generated program_code
        if (options.body instanceof FormData) {
          options.body.set('program_code', row.program_code);
        }

        delete row.id;
        delete row.created_at;
        delete row.updated_at;
        delete row.coordinator_ids;
        delete row.coordinators;
        delete row.poster;

        row.name = row.name.trim();
        row.venue = row.venue ? row.venue.trim() : 'Campus Innovation Hall';
        row.program_type = row.program_type || 'Workshop';
        row.description = row.description ? row.description.trim() : null;
        row.participants_count = row.participants_count ? Number(row.participants_count) : 0;
        row.status = row.status || 'Planned';

        if (posterDataUrl) {
          row.poster_url = posterDataUrl;
        } else if (row.poster_url && row.poster_url.trim()) {
          row.poster_url = row.poster_url.trim();
        } else {
          row.poster_url = null;
        }
        delete row.poster_removed;

        row.is_demo = row.is_demo ? 1 : 0;
        row.created_by = authState.getUser()?.username || 'admin';
        row.updated_by = authState.getUser()?.username || 'admin';

        const allowedProgCols = new Set([
          'program_code', 'name', 'program_date', 'start_time', 'end_time', 'venue',
          'program_type', 'description', 'participants_count', 'status', 'poster_url',
          'is_demo', 'created_by', 'updated_by'
        ]);
        const cleanRow = {};
        for (const [k, v] of Object.entries(row)) {
          if (allowedProgCols.has(k)) {
            cleanRow[k] = v;
          }
        }

        const { data: createdProg, error: insertErr } = await sb.from('programs').insert([cleanRow]).select().single();
        if (insertErr) throw new Error(insertErr.message);

        // Attach coordinators if provided
        if (Array.isArray(coordinatorIds) && coordinatorIds.length > 0 && createdProg?.id) {
          const coordRows = coordinatorIds
            .map(mId => ({
              program_id: createdProg.id,
              member_id: Number(mId),
              role_title: 'Coordinator'
            }))
            .filter(c => !isNaN(c.member_id) && c.member_id > 0);
          if (coordRows.length > 0) {
            await sb.from('program_coordinators').insert(coordRows);
          }
        }

        return {
          success: true,
          message: 'Program scheduled successfully in Supabase cloud database.',
          data: createdProg
        };
      }

      // 3D. Update Program PUT: /programs/:id
      const updateProgMatch = endpoint.match(/^\/programs\/(\d+)$/);
      if (updateProgMatch && method === 'PUT') {
        const programId = Number(updateProgMatch[1]);
        let row = {};
        let coordinatorIds = null;

        if (options.body instanceof FormData) {
          options.body.forEach((val, key) => {
            if (key === 'coordinator_ids') {
              try {
                coordinatorIds = typeof val === 'string' ? JSON.parse(val) : val;
              } catch (e) {
                coordinatorIds = String(val).split(',').map(s => s.trim()).filter(Boolean);
              }
            } else if (key !== 'poster') {
              row[key] = val;
            }
          });
        } else if (typeof options.body === 'string') {
          try {
            row = JSON.parse(options.body);
            if ('coordinator_ids' in row) coordinatorIds = row.coordinator_ids;
          } catch (e) { row = {}; }
        } else if (options.body) {
          row = { ...options.body };
          if ('coordinator_ids' in row) coordinatorIds = row.coordinator_ids;
        }

        let posterDataUrl = null;
        if (options.body instanceof FormData) {
          const posterFile = options.body.get('poster');
          if (posterFile && typeof posterFile === 'object' && posterFile.size > 0) {
            try {
              posterDataUrl = await compressImageFile(posterFile);
            } catch (e) {}
          }
        }

        delete row.id;
        delete row.created_at;
        delete row.updated_at;
        delete row.coordinator_ids;
        delete row.coordinators;
        delete row.poster;

        if (row.name) row.name = row.name.trim();
        if (row.venue) row.venue = row.venue.trim();
        if (row.description) row.description = row.description.trim();
        if ('participants_count' in row) row.participants_count = Number(row.participants_count) || 0;
        row.updated_by = authState.getUser()?.username || 'admin';
        row.updated_at = new Date().toISOString();

        if (posterDataUrl) {
          row.poster_url = posterDataUrl;
        } else if (row.poster_removed === 'true' || row.poster_removed === true) {
          row.poster_url = null;
        } else if (row.poster_url && row.poster_url.trim()) {
          row.poster_url = row.poster_url.trim();
        } else {
          delete row.poster_url;
        }
        delete row.poster_removed;

        const allowedProgCols = new Set([
          'program_code', 'name', 'program_date', 'start_time', 'end_time', 'venue',
          'program_type', 'description', 'participants_count', 'status', 'poster_url',
          'is_demo', 'updated_by', 'updated_at'
        ]);
        const cleanRow = {};
        for (const [k, v] of Object.entries(row)) {
          if (allowedProgCols.has(k)) {
            cleanRow[k] = v;
          }
        }

        let { data: updatedProg, error: updateErr } = await sb.from('programs').update(cleanRow).eq('id', programId).select().single();
        if (updateErr && cleanRow.program_code) {
          const res2 = await sb.from('programs').update(cleanRow).eq('program_code', cleanRow.program_code).select().single();
          if (!res2.error && res2.data) {
            updatedProg = res2.data;
            updateErr = null;
          }
        }

        if (updateErr) throw new Error(updateErr.message);

        // Update coordinators if provided
        if (Array.isArray(coordinatorIds)) {
          await sb.from('program_coordinators').delete().eq('program_id', programId);
          const coordRows = coordinatorIds
            .map(mId => ({
              program_id: programId,
              member_id: Number(mId),
              role_title: 'Coordinator'
            }))
            .filter(c => !isNaN(c.member_id) && c.member_id > 0);
          if (coordRows.length > 0) {
            await sb.from('program_coordinators').insert(coordRows);
          }
        }

        return {
          success: true,
          message: 'Program updated successfully in Supabase cloud database.',
          data: updatedProg
        };
      }

      // 3E. Delete Program DELETE: /programs/:id
      const delProgMatch = endpoint.match(/^\/programs\/(\d+)$/);
      if (delProgMatch && method === 'DELETE') {
        const programId = Number(delProgMatch[1]);
        await sb.from('program_coordinators').delete().eq('program_id', programId);
        const { error } = await sb.from('programs').delete().eq('id', programId);
        if (error) throw new Error(error.message);
        return { success: true, message: 'Program deleted from Supabase cloud database.' };
      }

      // 3F. Add Coordinator POST: /programs/:id/coordinators
      const addCoordMatch = endpoint.match(/^\/programs\/(\d+)\/coordinators$/);
      if (addCoordMatch && method === 'POST') {
        const programId = Number(addCoordMatch[1]);
        let body = {};
        try { body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body; } catch (e) {}
        const memberId = Number(body.member_id);
        const roleTitle = body.role_title || 'Coordinator';
        const { error } = await sb.from('program_coordinators').insert([{
          program_id: programId,
          member_id: memberId,
          role_title: roleTitle
        }]);
        if (error) throw new Error(error.message);
        return { success: true, message: 'Coordinator added.' };
      }

      // 3G. Remove Coordinator DELETE: /programs/:id/coordinators/:memberId
      const rmCoordMatch = endpoint.match(/^\/programs\/(\d+)\/coordinators\/(\d+)$/);
      if (rmCoordMatch && method === 'DELETE') {
        const programId = Number(rmCoordMatch[1]);
        const memberId = Number(rmCoordMatch[2]);
        const { error } = await sb.from('program_coordinators').delete().eq('program_id', programId).eq('member_id', memberId);
        if (error) throw new Error(error.message);
        return { success: true, message: 'Coordinator removed.' };
      }
    }

    // 4. Dashboard Stats endpoint
    if (endpoint.startsWith('/dashboard/stats')) {
      const [
        { count: totalMembers },
        { count: activeMembers },
        { count: totalDepts },
        { count: totalPrograms },
        { count: completedPrograms },
        { count: upcomingPrograms }
      ] = await Promise.all([
        sb.from('club_members').select('*', { count: 'exact', head: true }),
        sb.from('club_members').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        sb.from('departments').select('*', { count: 'exact', head: true }),
        sb.from('programs').select('*', { count: 'exact', head: true }),
        sb.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'Completed'),
        sb.from('programs').select('*', { count: 'exact', head: true }).in('status', ['Planned', 'Upcoming'])
      ]);
      const { data: depts } = await sb.from('departments').select('*');
      const { data: recentPrograms } = await sb.from('programs').select('*').order('program_date', { ascending: false }).limit(5);
      return {
        success: true,
        data: {
          summary: {
            totalMembers: totalMembers || 0,
            activeMembers: activeMembers || 0,
            totalDepartments: totalDepts || 0,
            totalPrograms: totalPrograms || 0,
            upcomingPrograms: upcomingPrograms || 0,
            completedPrograms: completedPrograms || 0,
            ongoingPrograms: 0,
            plannedPrograms: (totalPrograms || 0) - (completedPrograms || 0),
            totalCollected: 0,
            totalSpent: 0,
            currentBalance: 0,
            totalSponsorsCount: 0,
            totalSponsorshipSum: 0,
            programsThisYear: totalPrograms || 0,
            programsThisMonth: 0
          },
          departments: (depts || []).map(d => ({ id: d.id, name: d.name, count: 0 })),
          recentPrograms: recentPrograms || [],
          monthlyPrograms: []
        }
      };
    }
  } catch (sbErr) {
    console.warn('[Supabase Cloud Request Error]', sbErr);
    throw sbErr;
  }
  return null;
}

async function request(endpoint, options = {}) {
  const token = authState.getToken();
  const headers = options.headers || {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers
  };

  // 1. When Supabase is configured, use Supabase as the primary cloud database
  const isSupabaseManaged = 
    endpoint.startsWith('/members') || 
    endpoint.startsWith('/departments') || 
    endpoint.startsWith('/programs') || 
    endpoint.startsWith('/dashboard/stats');

  if (isSupabaseConfigured() && isSupabaseManaged) {
    try {
      const sbData = await handleSupabaseRequest(endpoint, options);
      if (sbData) {
        // If write operation, also mirror to local backend in background if available
        const method = (options.method || 'GET').toUpperCase();
        if (method !== 'GET') {
          fetch(`${API_BASE}${endpoint}`, config).catch(() => {});
        }
        return sbData;
      }
    } catch (sbErr) {
      console.warn('[Supabase Cloud Request Failed, attempting local fallback]', sbErr);
      if (sbErr.message && !sbErr.message.includes('fetch') && !sbErr.message.includes('network') && !sbErr.message.includes('Failed to fetch')) {
        throw sbErr;
      }
    }
  }

  // 2. Fallback to Express backend or static mock
  try {
    let res;
    let isOfflineStatic = false;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, config);
      if (res.status === 404) {
        // Static hosting like Netlify where /api routes return 404
        isOfflineStatic = true;
      }
    } catch (netErr) {
      isOfflineStatic = true;
    }

    if (isOfflineStatic) {
      if (isSupabaseConfigured()) {
        const sbData = await handleSupabaseRequest(endpoint, options);
        if (sbData) return sbData;
      }
      return getStaticMockData(endpoint, options);
    }

    let data = {};
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {}

    if (res.status === 401) {
      // Session expired or unauthenticated
      authState.removeToken();
      authState.removeUser();
      if (!window.location.pathname.includes('/login')) {
        window.dispatchEvent(new CustomEvent('stic_unauthorized'));
      }
      throw new Error(data.message || 'Invalid username or password.');
    }

    if (!res.ok || data.success === false) {
      throw new Error(data.message || `Request failed (${res.status}). Please check backend server.`);
    }
    return data;
  } catch (err) {
    // If backend failed and it's not a 401 auth error, use Supabase or static demo fallback
    if (!err.message?.includes('Invalid username')) {
      if (isSupabaseConfigured()) {
        const sbData = await handleSupabaseRequest(endpoint, options);
        if (sbData) return sbData;
      }
      return getStaticMockData(endpoint, options);
    }
    throw err;
  }
}

// Fallback Mock Dataset for Zero-Backend Static Hosting (e.g. Netlify Drop)
function getStaticMockData(endpoint, options = {}) {
  // Login fallback
  if (endpoint.startsWith('/auth/login')) {
    let role = 'President';
    try {
      if (options.body) {
        const b = JSON.parse(options.body);
        role = b.role || b.username || 'President';
      }
    } catch (e) {}

    return {
      success: true,
      message: 'Demo Login successful (Static Preview Mode).',
      token: 'static-demo-token-12345',
      user: {
        id: 1,
        username: role.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        full_name: role === 'HOD' ? 'Dr. CSE Department Head' : `${role}`,
        role: role,
        avatar_url: '',
        is_website_handler: role === 'STIC Website Handler',
        permissions: {
          manage_members: true,
          manage_programs: true,
          manage_media: true,
          manage_documents: true,
          manage_finance: role === 'Finance Lead' || role === 'President' || role === 'HOD',
          manage_sponsors: true,
          manage_announcements: true
        }
      }
    };
  }

  // Dashboard stats fallback
  if (endpoint.startsWith('/dashboard/stats')) {
    return {
      success: true,
      data: {
        summary: {
          totalMembers: 128,
          activeMembers: 114,
          totalDepartments: 5,
          totalPrograms: 14,
          upcomingPrograms: 4,
          completedPrograms: 8,
          ongoingPrograms: 1,
          plannedPrograms: 1,
          totalCollected: 245000,
          totalSpent: 112000,
          currentBalance: 133000,
          totalSponsorsCount: 6,
          totalSponsorshipSum: 150000,
          programsThisYear: 14,
          programsThisMonth: 3
        },
        departments: [
          { id: 1, name: 'Content & Documentation', count: 22, lead_name: 'Neha Verma', co_lead_name: 'Ananya Deshmukh' },
          { id: 2, name: 'Finance & Sponsorship', count: 14, lead_name: 'Sneha Kulkarni', co_lead_name: 'Rohan Mehra' },
          { id: 3, name: 'Social Media & Publicity', count: 26, lead_name: 'Siddharth Nair', co_lead_name: 'Pooja Iyer' },
          { id: 4, name: 'Technical & Infrastructure', count: 34, lead_name: 'Kaviraj Patel', co_lead_name: 'Aarav Sharma' },
          { id: 5, name: 'Event Coordinators', count: 32, lead_name: 'Vikram Singh', co_lead_name: 'Aditya Varma' },
          { id: 6, name: 'Project & Innovation', count: 18, lead_name: 'Divya Reddy', co_lead_name: 'Rahul Kapoor' }
        ],
        recentPrograms: [
          { id: 1, title: 'Annual Sustainable Tech Hackathon 2026', program_date: '2026-10-15', status: 'Upcoming', venue: 'SRIT Main Auditorium' },
          { id: 2, title: 'AI & Green Computing Hands-on Workshop', program_date: '2026-09-28', status: 'Completed', venue: 'Lab 3, CSE Dept' },
          { id: 3, title: 'Eco-Innovation Pitch Challenge', program_date: '2026-08-14', status: 'Completed', venue: 'Seminar Hall' }
        ],
        monthlyPrograms: [
          { month: 'Jan', count: 1 }, { month: 'Feb', count: 2 }, { month: 'Mar', count: 1 },
          { month: 'Apr', count: 0 }, { month: 'May', count: 1 }, { month: 'Jun', count: 2 },
          { month: 'Jul', count: 1 }, { month: 'Aug', count: 2 }, { month: 'Sep', count: 2 },
          { month: 'Oct', count: 2 }, { month: 'Nov', count: 0 }, { month: 'Dec', count: 0 }
        ]
      }
    };
  }

  // Members fallback
  if (endpoint.startsWith('/members')) {
    return {
      success: true,
      data: [
        { id: 1, full_name: 'Aarav Sharma', college_id: 'STIC-2024-001', email: 'aarav.sharma@srit.ac.in', phone: '+91 9876543210', year: '4th Year', branch: 'Computer Science & Engineering', position: 'President', department_name: 'Technical & Innovation', status: 'Active' },
        { id: 2, full_name: 'Ananya Deshmukh', college_id: 'STIC-2024-002', email: 'ananya@srit.ac.in', phone: '+91 9876543211', year: '3rd Year', branch: 'Environmental Engineering', position: 'Co-President', department_name: 'Content & Documentation', status: 'Active' },
        { id: 3, full_name: 'Rohan Mehra', college_id: 'STIC-2025-003', email: 'rohan.mehra@srit.ac.in', phone: '+91 9876543212', year: '3rd Year', branch: 'Mechanical Engineering', position: 'Vice President', department_name: 'Events & Operations', status: 'Active' },
        { id: 4, full_name: 'Pooja Iyer', college_id: 'STIC-2025-004', email: 'pooja.iyer@srit.ac.in', phone: '+91 9876543213', year: '2nd Year', branch: 'Electronics & Communication', position: 'Co-Vice President', department_name: 'Technical & Innovation', status: 'Active' },
        { id: 5, full_name: 'Vikram Singh', college_id: 'STIC-2025-005', email: 'vikram.singh@srit.ac.in', phone: '+91 9876543214', year: '3rd Year', branch: 'Civil & Infrastructure Engg', position: 'Secretary', department_name: 'Finance & Treasury', status: 'Active' },
        { id: 6, full_name: 'Priya Sharma', college_id: 'STIC-2025-006', email: 'priya.sharma@srit.ac.in', phone: '+91 9876543215', year: '3rd Year', branch: 'Computer Science & Engineering', position: 'Technical Lead', department_name: 'Technical & Innovation', status: 'Active' },
        { id: 7, full_name: 'Arjun Nair', college_id: 'STIC-2025-007', email: 'arjun.nair@srit.ac.in', phone: '+91 9876543216', year: '3rd Year', branch: 'Information Technology', position: 'Content & Documentation Lead', department_name: 'Content & Documentation', status: 'Active' },
        { id: 8, full_name: 'Sneha Kulkarni', college_id: 'STIC-2025-008', email: 'sneha.k@srit.ac.in', phone: '+91 9876543217', year: '2nd Year', branch: 'Electronics & Communication', position: 'Social Media & PR Lead', department_name: 'Social Media & Branding', status: 'Active' },
        { id: 9, full_name: 'Karthik Rao', college_id: 'STIC-2025-009', email: 'karthik.rao@srit.ac.in', phone: '+91 9876543218', year: '3rd Year', branch: 'Electrical & Electronics', position: 'Finance & Treasurer Lead', department_name: 'Finance & Treasury', status: 'Active' },
        { id: 10, full_name: 'Neha Gupta', college_id: 'STIC-2025-010', email: 'neha.gupta@srit.ac.in', phone: '+91 9876543219', year: '2nd Year', branch: 'Computer Science & Engineering', position: 'Event Management Lead', department_name: 'Events & Operations', status: 'Active' },
        { id: 11, full_name: 'Rahul Joshi', college_id: 'STIC-2025-011', email: 'rahul.joshi@srit.ac.in', phone: '+91 9876543220', year: '3rd Year', branch: 'Mechanical Engineering', position: 'Event Coordinator', department_name: 'Events & Operations', status: 'Active' },
        { id: 12, full_name: 'Meera Nambiar', college_id: 'STIC-2025-012', email: 'meera.n@srit.ac.in', phone: '+91 9876543221', year: '2nd Year', branch: 'Biotechnology', position: 'Event Coordinator', department_name: 'Events & Operations', status: 'Active' },
        // Enrolled 2nd Year Club Members from Roster
        { id: 19, full_name: "Y. Akshaya", college_id: "254G1A0517", email: "254g1a0517@srit.ac.in", phone: "9014620331", year: "2nd Year", branch: "Computer Science & Engineering (CSE-A)", position: "Club Member", status: "Active", notes: "Section: CSE-A" },
        { id: 20, full_name: "D. Anitha Krupa", college_id: "254G1A0526", email: "254g1a0526@srit.ac.in", phone: "9989400310", year: "2nd Year", branch: "Computer Science & Engineering (CSE-A)", position: "Club Member", status: "Active", notes: "Section: CSE-A" },
        { id: 21, full_name: "Bharani Kumar Undra", college_id: "254G1A0541", email: "254G1A0541@srit.ac.in", phone: "9392300975", year: "2nd Year", branch: "Computer Science & Engineering (CSE-A)", position: "Club Member", status: "Active", notes: "Section: CSE-A" },
        { id: 22, full_name: "D. Chand Naveed", college_id: "254G1A0550", email: "254G1A0550@srit.ac.in", phone: "9491052753", year: "2nd Year", branch: "Computer Science & Engineering (CSE-A)", position: "Club Member", status: "Active", notes: "Section: CSE-A" },
        { id: 23, full_name: "Chandu B R", college_id: "254G1A0552", email: "254g1a0552@srit.ac.in", phone: "6361911096", year: "2nd Year", branch: "Computer Science & Engineering (CSE-A)", position: "Club Member", status: "Active", notes: "Section: CSE-A" },
        { id: 24, full_name: "O. Deepika", college_id: "254G1A0560", email: "254g1a0560@srit.ac.in", phone: "9182256041", year: "2nd Year", branch: "Computer Science & Engineering (CSE-A)", position: "Club Member", status: "Active", notes: "Section: CSE-A" },
        { id: 25, full_name: "Geethika A", college_id: "254G1A0575", email: "254G1A0575@srit.ac.in", phone: "9014180293", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 26, full_name: "Gireeshma D", college_id: "254G1A0577", email: "254g1a0577@srit.ac.in", phone: "9493275145", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 27, full_name: "B.S. Gousiya", college_id: "254G1A0579", email: "254g1a0579@srit.ac.in", phone: "9515916520", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 28, full_name: "N. Gousiya Hajira Nadba", college_id: "254G1A0580", email: "254g1a0580@srit.ac.in", phone: "7981931598", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 29, full_name: "D. Govardhan", college_id: "254G1A0581", email: "254g1a0581@srit.ac.in", phone: "9392985012", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 30, full_name: "V. Harika Reddy", college_id: "254G1A0588", email: "254g1a0588@srit.ac.in", phone: "8639712596", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 31, full_name: "Harish U", college_id: "254G1A0590", email: "254g1a0590@srit.ac.in", phone: "9391924059", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 32, full_name: "G. Harsha Vardhan", college_id: "254G1A0591", email: "254g1a0591@srit.ac.in", phone: "7617643043", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 33, full_name: "Harshitha K", college_id: "254G1A0597", email: "254g1a0597@srit.ac.in", phone: "7396537469", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 34, full_name: "G.H. Hasana", college_id: "254G1A0598", email: "254g1a0598@srit.ac.in", phone: "8790332226", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 35, full_name: "K.C. Kondappa", college_id: "254G1A05A0", email: "254g1a05a0@srit.ac.in", phone: "9550624318", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 36, full_name: "Himavarsha Palabandla", college_id: "254G1A05A4", email: "254g1a05a4@srit.ac.in", phone: "6304188476", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 37, full_name: "P. Jyoshika", college_id: "254G1A05B7", email: "254g1a05b7@srit.ac.in", phone: "6302500552", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 38, full_name: "S. Kanees Farida", college_id: "254G1A05B9", email: "254g1a05b9@srit.ac.in", phone: "8074340242", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 39, full_name: "Kavya S", college_id: "254G1A05C4", email: "254g1a05c4@srit.ac.in", phone: "8008801368", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 40, full_name: "K.V. Keerthi", college_id: "254G1A05C8", email: "254g1a05c8@srit.ac.in", phone: "9322365529", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", notes: "Section: CSE-B" },
        { id: 41, full_name: "S. Lavanya", college_id: "254G1A05E0", email: "254g1a05e0@srit.ac.in", phone: "7337508736", year: "2nd Year", branch: "Computer Science & Engineering (CSE-C)", position: "Club Member", status: "Active", notes: "Section: CSE-C" },
        { id: 42, full_name: "J. Likhitha", college_id: "254G1A05E4", email: "254g1a05e4@srit.ac.in", phone: "9573498670", year: "2nd Year", branch: "Computer Science & Engineering (CSE-C)", position: "Club Member", status: "Active", notes: "Section: CSE-C" },
        { id: 43, full_name: "Lohith S", college_id: "254G1A05E6", email: "254g1a05e6@srit.ac.in", phone: "9515968230", year: "2nd Year", branch: "Computer Science & Engineering (CSE-C)", position: "Club Member", status: "Active", notes: "Section: CSE-C" },
        { id: 44, full_name: "Mary M", college_id: "254G1A05G5", email: "254g1a05g5@srit.ac.in", phone: "9059531487", year: "2nd Year", branch: "Computer Science & Engineering (CSE-C)", position: "Club Member", status: "Active", notes: "Section: CSE-C" },
        { id: 45, full_name: "Akbarsab Mohammed Jaffer Sadiq", college_id: "254G1A05H1", email: "254g1a05h1@srit.ac.in", phone: "9391669255", year: "2nd Year", branch: "Computer Science & Engineering (CSE-C)", position: "Club Member", status: "Active", notes: "Section: CSE-C" },
        { id: 46, full_name: "Shaik Mohammed Muheeb Muhiuddin", college_id: "254G1A05H2", email: "254g1a05h2@srit.ac.in", phone: "9866137776", year: "2nd Year", branch: "Computer Science & Engineering (CSE-C)", position: "Club Member", status: "Active", notes: "Section: CSE-C" },
        { id: 47, full_name: "K. Mounika", college_id: "254G1A05H5", email: "254g1a05h5@srit.ac.in", phone: "9182693071", year: "2nd Year", branch: "Computer Science & Engineering (CSE-C)", position: "Club Member", status: "Active", notes: "Section: CSE-C" },
        { id: 48, full_name: "Vellala Lingeswara Reddy", college_id: "264G5A0515", email: "264g5a0515@srit.ac.in", phone: "9642692095", year: "2nd Year", branch: "Computer Science & Engineering (CSE-C)", position: "Club Member", status: "Active", notes: "Section: CSE-C" },
        { id: 49, full_name: "K. Mohammad Yaseen", college_id: "264G5A0519", email: "264g5a0519@srit.ac.in", phone: "6304209180", year: "2nd Year", branch: "Computer Science & Engineering (CSE-C)", position: "Club Member", status: "Active", notes: "Section: CSE-C" },
        { id: 50, full_name: "Vankam Navaneeth", college_id: "264G5A0520", email: "264g5a0520@srit.ac.in", phone: "9390083261", year: "2nd Year", branch: "Computer Science & Engineering (CSE-C)", position: "Club Member", status: "Active", notes: "Section: CSE-C" },
        { id: 51, full_name: "Nikhila P", college_id: "254G1A05L5", email: "254g1a05l5@srit.ac.in", phone: "6303782580", year: "2nd Year", branch: "Computer Science & Engineering (CSE-D)", position: "Club Member", status: "Active", notes: "Section: CSE-D" },
        { id: 52, full_name: "R. Parishreya", college_id: "254G1A05M4", email: "254g1a05m4@srit.ac.in", phone: "7675969478", year: "2nd Year", branch: "Computer Science & Engineering (CSE-D)", position: "Club Member", status: "Active", notes: "Section: CSE-D" },
        { id: 53, full_name: "K. Poojitha Royal", college_id: "254G1A05N4", email: "254g1a05n4@srit.ac.in", phone: "8977661333", year: "2nd Year", branch: "Computer Science & Engineering (CSE-D)", position: "Club Member", status: "Active", notes: "Section: CSE-D" },
        { id: 54, full_name: "Sai Charan Reddy Sankepalli", college_id: "254G1A05T0", email: "254g1a05t0@srit.ac.in", phone: "8074614684", year: "2nd Year", branch: "Computer Science & Engineering (CSE-E)", position: "Club Member", status: "Active", notes: "Section: CSE-E" },
        { id: 55, full_name: "P. Sai Jahnavi", college_id: "254G1A05T2", email: "254g1a05t2@srit.ac.in", phone: "6301147996", year: "2nd Year", branch: "Computer Science & Engineering (CSE-E)", position: "Club Member", status: "Active", notes: "Section: CSE-E" },
        { id: 56, full_name: "Kota Sai Venkata Sumanth Reddy", college_id: "254G1A05T6", email: "254g1a05t6@srit.ac.in", phone: "6304964717", year: "2nd Year", branch: "Computer Science & Engineering (CSE-E)", position: "Club Member", status: "Active", notes: "Section: CSE-E" },
        { id: 57, full_name: "K. Shanwaz", college_id: "254G1A05V7", email: "254g1a05v7@srit.ac.in", phone: "7672035981", year: "2nd Year", branch: "Computer Science & Engineering (CSE-E)", position: "Club Member", status: "Active", notes: "Section: CSE-E" },
        { id: 58, full_name: "B. Uha", college_id: "254G1A05AE", email: "254g1a05ae@srit.ac.in", phone: "9515508598", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 59, full_name: "Usha Sri M", college_id: "254G1A05AH", email: "254g1a05ah@srit.ac.in", phone: "9059299601", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 60, full_name: "G. Ushasri Sai", college_id: "254G1A05AJ", email: "254g1a05aj@srit.ac.in", phone: null, year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 61, full_name: "S. Zunaira", college_id: "254G1A05AP", email: "254g1a05ap@srit.ac.in", phone: "8500852026", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 62, full_name: "Varsha T", college_id: "254G1A05AQ", email: "254g1a05aq@srit.ac.in", phone: "9398224099", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 63, full_name: "D. Vazeer Aman", college_id: "254G1A05AT", email: "254g1a05at@srit.ac.in", phone: "9704925392", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 64, full_name: "G. Veena", college_id: "254G1A05AU", email: "254g1a05au@srit.ac.in", phone: "8688592771", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 65, full_name: "Venkata Greeshma Sakam", college_id: "254G1A05AV", email: "254g1a05av@srit.ac.in", phone: "6303417879", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 66, full_name: "Srivalli Rupanagudi", college_id: "254G1A05AW", email: "254g1a05aw@srit.ac.in", phone: "7569593885", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 67, full_name: "Tejaswi B", college_id: "254G1A05AX", email: "254g1a05ax@srit.ac.in", phone: "8341789249", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 68, full_name: "G. Vennela", college_id: "254G1A05BB", email: "254g1a05bb@srit.ac.in", phone: "9964721445", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 69, full_name: "C. Vinitha Reddy", college_id: "254G1A05BG", email: "254g1a05bg@srit.ac.in", phone: "9392772854", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 70, full_name: "Vyshnavi M", college_id: "254G1A05BR", email: "254g1a05br@srit.ac.in", phone: "6303893810", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 71, full_name: "Yaswanth Sai Teja Sake", college_id: "254G1A05BW", email: "sakeyaswanth633@gmail.com", phone: "9849385578", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 72, full_name: "Yashwitha A", college_id: "254G1A05BX", email: "254g1a05bx@srit.ac.in", phone: null, year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 73, full_name: "D. Yuva Sri", college_id: "254G1A05BZ", email: "254g1a05bz@srit.ac.in", phone: "9381609973", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 74, full_name: "Devzai Zuha", college_id: "254G1A05CA", email: "254g1a05ca@srit.ac.in", phone: "6302254708", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 75, full_name: "G. Tejaswini", college_id: "254G1A05Z4", email: "254g1a05z4@srit.ac.in", phone: "9100016227", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 76, full_name: "G. Thanuja", college_id: "254G1A05Z7", email: "254g1a05z7@srit.ac.in", phone: "6281538149", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 77, full_name: "U. Thanusree", college_id: "254G1A05Z9", email: "254g1a05z9@srit.ac.in", phone: "9281018735", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 78, full_name: "P. Sai Venkata Krutheek", college_id: "264G5A0534", email: "264g5a0534@srit.ac.in", phone: "7601060569", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", notes: "Section: CSE-F" },
        { id: 79, full_name: "S. Vinuthana Sri", college_id: "254G1A05BJ", email: "254g1a05bj@srit.ac.in", phone: "9014598388", year: "2nd Year", branch: "Computer Science & Engineering (CSE-B)", position: "Club Member", status: "Active", section: "CSE-B", notes: "Section: CSE-B" },
        { id: 80, full_name: "venkata sai nihas P", college_id: "254G1A05AY", email: "254g1a05ay@srit.ac.in", phone: "9492655062", year: "2nd Year", branch: "Computer Science & Engineering (CSE-F)", position: "Club Member", status: "Active", section: "CSE-F", notes: "Section: CSE-F" }
      ]
    };
  }

  // Programs fallback
  if (endpoint.startsWith('/programs')) {
    return {
      success: true,
      data: [
        { id: 1, title: 'Annual Sustainable Tech Hackathon 2026', program_date: '2026-10-15', status: 'Upcoming', venue: 'SRIT Main Auditorium', budget: 45000, description: '36-hour flagship hackathon on green computing and IoT innovations.' },
        { id: 2, title: 'AI & Green Computing Hands-on Workshop', program_date: '2026-09-28', status: 'Completed', venue: 'Lab 3, CSE Dept', budget: 18000, description: 'Intensive workshop on optimizing neural network inferencing for low-power edge devices.' },
        { id: 3, title: 'Eco-Innovation Pitch Challenge', program_date: '2026-08-14', status: 'Completed', venue: 'Seminar Hall', budget: 15000, description: 'Inter-collegiate startup pitch competition focused on sustainable tech solutions.' }
      ]
    };
  }

  // Departments fallback
  if (endpoint.startsWith('/departments')) {
    return {
      success: true,
      data: [
        { id: 1, name: 'Content & Documentation', description: 'Manages official documentation, meeting minutes, and event reports.', member_count: 22, lead_name: 'Neha Verma', co_lead_name: 'Ananya Deshmukh' },
        { id: 2, name: 'Finance & Sponsorship', description: 'Manages budgets, ledger transactions, and club accounts.', member_count: 14, lead_name: 'Sneha Kulkarni', co_lead_name: 'Rohan Mehra' },
        { id: 3, name: 'Social Media & Publicity', description: 'Maintains club presence, graphics, announcements, and coverage.', member_count: 26, lead_name: 'Siddharth Nair', co_lead_name: 'Pooja Iyer' },
        { id: 4, name: 'Technical & Infrastructure', description: 'Handles software engineering, web portal, systems, and technical infrastructure.', member_count: 34, lead_name: 'Kaviraj Patel', co_lead_name: 'Aarav Sharma' },
        { id: 5, name: 'Event Coordinators', description: 'Coordinates event logistics, guest hosting, volunteers, and venues.', member_count: 32, lead_name: 'Vikram Singh', co_lead_name: 'Aditya Varma' },
        { id: 6, name: 'Project & Innovation', description: 'Drives student-led engineering prototypes, green hardware, research papers, and patent filings.', member_count: 18, lead_name: 'Divya Reddy', co_lead_name: 'Rahul Kapoor' }
      ]
    };
  }

  // Settings fallback
  if (endpoint.startsWith('/settings')) {
    return {
      success: true,
      data: {
        club_name: 'CSE – STIC',
        club_tagline: 'Innovate • Sustain • Impact',
        academic_year: '2026-2027',
        demo_stats: null
      }
    };
  }

  // Announcements fallback
  if (endpoint.startsWith('/announcements')) {
    return {
      success: true,
      data: [
        { id: 1, title: 'Welcome to the New Academic Year 2026-2027!', content: 'Registrations are now open for club working committee selections.', is_active: true, created_at: '2026-10-01' }
      ]
    };
  }

  // Default fallback for any other requests (photos, docs, finance, etc.)
  return {
    success: true,
    data: [],
    message: 'Operation completed (Static Mode).'
  };
}

export const api = {
  // Auth
  login: (roleOrUsername, password) => {
    let payload = {};
    if (typeof roleOrUsername === 'object' && roleOrUsername !== null) {
      payload = roleOrUsername;
    } else {
      payload = { role: roleOrUsername, username: roleOrUsername, password };
    }
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getRoles: () => request('/auth/roles'),
  getMe: () => request('/auth/me'),
  changeCredentials: (data) =>
    request('/auth/change-credentials', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateProfilePhoto: (formData) =>
    request('/auth/profile-photo', {
      method: 'POST',
      body: formData
    }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Members
  getMembers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/members${query ? `?${query}` : ''}`);
  },
  getMember: (id) => request(`/members/${id}`),
  createMember: (formDataOrJson) => {
    const isFormData = formDataOrJson instanceof FormData;
    return request('/members', {
      method: 'POST',
      body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson)
    });
  },
  updateMember: (id, formDataOrJson) => {
    const isFormData = formDataOrJson instanceof FormData;
    return request(`/members/${id}`, {
      method: 'PUT',
      body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson)
    });
  },
  deleteMember: (id) =>
    request(`/members/${id}`, {
      method: 'DELETE'
    }),

  // Departments
  getDepartments: () => request('/departments'),
  getDepartment: (id) => request(`/departments/${id}`),
  createDepartment: (data) =>
    request('/departments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateDepartment: (id, data) =>
    request(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  assignDeptMember: (deptId, memberId) =>
    request(`/departments/${deptId}/members`, {
      method: 'POST',
      body: JSON.stringify({ member_id: memberId })
    }),
  removeDeptMember: (deptId, memberId) =>
    request(`/departments/${deptId}/members/${memberId}`, {
      method: 'DELETE'
    }),

  // Programs
  getPrograms: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/programs${query ? `?${query}` : ''}`);
  },
  getProgram: (id) => request(`/programs/${id}`),
  createProgram: (formData) =>
    request('/programs', {
      method: 'POST',
      body: formData
    }),
  updateProgram: (id, formData) =>
    request(`/programs/${id}`, {
      method: 'PUT',
      body: formData
    }),
  deleteProgram: (id) =>
    request(`/programs/${id}`, {
      method: 'DELETE'
    }),
  addCoordinator: (programId, data) =>
    request(`/programs/${programId}/coordinators`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  removeCoordinator: (programId, memberId) =>
    request(`/programs/${programId}/coordinators/${memberId}`, {
      method: 'DELETE'
    }),

  // Photos
  getPhotos: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/photos${query ? `?${query}` : ''}`);
  },
  uploadPhotos: (formData) =>
    request('/photos', {
      method: 'POST',
      body: formData
    }),
  updatePhoto: (id, data) =>
    request(`/photos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deletePhoto: (id) =>
    request(`/photos/${id}`, {
      method: 'DELETE'
    }),

  // Videos
  getVideos: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/videos${query ? `?${query}` : ''}`);
  },
  createVideo: (formDataOrJson) => {
    const isFormData = formDataOrJson instanceof FormData;
    return request('/videos', {
      method: 'POST',
      body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson)
    });
  },
  updateVideo: (id, data) =>
    request(`/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteVideo: (id) =>
    request(`/videos/${id}`, {
      method: 'DELETE'
    }),

  // Documents & Templates (STIC Template Generator)
  getTemplates: () => request('/documents/templates'),
  getTemplate: (id) => request(`/documents/templates/${id}`),
  createTemplate: (data) =>
    request('/documents/templates', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateTemplate: (id, data) =>
    request(`/documents/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  // Custom User Uploaded Templates
  getCustomTemplates: () => request('/documents/custom-templates'),
  getCustomTemplate: (id) => request(`/documents/custom-templates/${id}`),
  uploadCustomTemplate: (formData) =>
    request('/documents/custom-templates/upload', {
      method: 'POST',
      body: formData
    }),
  deleteCustomTemplate: (id) =>
    request(`/documents/custom-templates/${id}`, {
      method: 'DELETE'
    }),
  detectPlaceholders: (id) =>
    request(`/documents/custom-templates/${id}/detect-placeholders`, {
      method: 'POST'
    }),
  generateFromCustomTemplate: (id, payload) =>
    request(`/documents/custom-templates/${id}/generate`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getDocuments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/documents${query ? `?${query}` : ''}`);
  },
  uploadDocument: (formData) =>
    request('/documents', {
      method: 'POST',
      body: formData
    }),
  updateDocument: (id, data) =>
    request(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteDocument: (id) =>
    request(`/documents/${id}`, {
      method: 'DELETE'
    }),

  // Finance
  getFinanceOverview: (year) =>
    request(`/finance/overview${year ? `?year=${year}` : ''}`),
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/finance/transactions${query ? `?${query}` : ''}`);
  },
  createTransaction: (formData) =>
    request('/finance/transactions', {
      method: 'POST',
      body: formData
    }),
  updateTransaction: (id, formData) =>
    request(`/finance/transactions/${id}`, {
      method: 'PUT',
      body: formData
    }),
  deleteTransaction: (id) =>
    request(`/finance/transactions/${id}`, {
      method: 'DELETE'
    }),
  batchDeleteTransactions: (ids) =>
    request('/finance/transactions/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    }),
  resetFinanceSummary: (payload = {}) =>
    request('/finance/reset-summary', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Sponsors
  getSponsors: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sponsors${query ? `?${query}` : ''}`);
  },
  createSponsor: (formData) =>
    request('/sponsors', {
      method: 'POST',
      body: formData
    }),
  updateSponsor: (id, formData) =>
    request(`/sponsors/${id}`, {
      method: 'PUT',
      body: formData
    }),
  deleteSponsor: (id) =>
    request(`/sponsors/${id}`, {
      method: 'DELETE'
    }),

  // Social Media & Official STIC Links
  getOfficialLinks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/social/links${query ? `?${query}` : ''}`);
  },
  createOfficialLink: (data) =>
    request('/social/links', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateOfficialLink: (id, data) =>
    request(`/social/links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteOfficialLink: (id) =>
    request(`/social/links/${id}`, {
      method: 'DELETE'
    }),
  // Social Media & Connected Apps Management
  wipeSocialArchive: () =>
    request('/social/wipe', { method: 'POST' }),

  // Instagram
  getInstagramInfo: () => request('/social/instagram/info'),
  connectInstagram: (data) =>
    request('/social/instagram/connect', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  disconnectInstagram: () =>
    request('/social/instagram/disconnect', {
      method: 'POST'
    }),
  refreshInstagram: () =>
    request('/social/instagram/refresh', {
      method: 'POST'
    }),
  postInstagram: (formDataOrJson) => {
    const isFormData = formDataOrJson instanceof FormData;
    return request('/social/instagram/post', {
      method: 'POST',
      body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson)
    });
  },

  // WhatsApp
  getWhatsAppInfo: () => request('/social/whatsapp/info'),
  connectWhatsApp: (data) =>
    request('/social/whatsapp/connect', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  disconnectWhatsApp: () =>
    request('/social/whatsapp/disconnect', {
      method: 'POST'
    }),
  refreshWhatsApp: () =>
    request('/social/whatsapp/refresh', {
      method: 'POST'
    }),
  broadcastWhatsApp: (formDataOrJson) => {
    const isFormData = formDataOrJson instanceof FormData;
    return request('/social/whatsapp/broadcast', {
      method: 'POST',
      body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson)
    });
  },

  // Connected Apps (LinkedIn, GitHub, etc.)
  getConnectedApps: () => request('/social/apps'),
  connectApp: (data) =>
    request('/social/apps/connect', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  disconnectApp: (platform) =>
    request(`/social/apps/${encodeURIComponent(platform)}`, {
      method: 'DELETE'
    }),
  refreshApp: (platform) =>
    request(`/social/apps/refresh/${encodeURIComponent(platform)}`, {
      method: 'POST'
    }),
  postAppUpdate: (formDataOrJson) => {
    const isFormData = formDataOrJson instanceof FormData;
    return request('/social/apps/post', {
      method: 'POST',
      body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson)
    });
  },

  getSocialMetadata: (url) =>
    request(`/social/metadata?url=${encodeURIComponent(url)}`),
  getSocial: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/social${query ? `?${query}` : ''}`);
  },
  createSocial: (body) => {
    const isFormData = body instanceof FormData;
    return request('/social', {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  },
  updateSocial: (id, body) => {
    const isFormData = body instanceof FormData;
    return request(`/social/${id}`, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body)
    });
  },
  deleteSocial: (id) =>
    request(`/social/${id}`, {
      method: 'DELETE'
    }),

  // Coordinators
  getCoordinators: () => request('/coordinators'),

  // Search
  search: (query) => request(`/search?q=${encodeURIComponent(query)}`),

  // Settings & DPs
  getSettings: () => request('/settings'),
  updateSettings: (formData) =>
    request('/settings', {
      method: 'PUT',
      body: formData
    }),
  setGalleryDp: (body) => {
    const isFormData = body instanceof FormData;
    return request('/settings/gallery-dp', {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  },
  removeGalleryDp: () =>
    request('/settings/gallery-dp', {
      method: 'DELETE'
    }),
  setVideoDp: (body) => {
    const isFormData = body instanceof FormData;
    return request('/settings/video-dp', {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  },
  removeVideoDp: () =>
    request('/settings/video-dp', {
      method: 'DELETE'
    }),
  clearDemoData: () =>
    request('/settings/clear-demo-data', {
      method: 'POST'
    }),
  resetDemoData: () =>
    request('/settings/reset-demo-data', {
      method: 'POST'
    }),

  // Website Announcements & Notices
  getAnnouncements: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/announcements${query ? `?${query}` : ''}`);
  },
  createAnnouncement: (data) =>
    request('/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAnnouncement: (id, data) =>
    request(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  toggleAnnouncement: (id) =>
    request(`/announcements/${id}/toggle`, {
      method: 'PATCH'
    }),
  deleteAnnouncement: (id) =>
    request(`/announcements/${id}`, {
      method: 'DELETE'
    }),

  // Role Permissions Configuration
  getPermissions: () => request('/settings/permissions'),
  updatePermissions: (permissions) =>
    request('/settings/permissions', {
      method: 'PUT',
      body: JSON.stringify({ permissions })
    }),

  // Activity Log (Immutable, Persistent, Real IST)
  getActivityLogs: (params = {}) => {
    const query = new URLSearchParams();
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        query.append(k, params[k]);
      }
    });
    const qs = query.toString();
    return request(`/activity-log${qs ? `?${qs}` : ''}`);
  },

  // Audit Logs (legacy mapping to activity-log)
  getAuditLogs: (limit = 100) => request(`/activity-log?limit=${limit}`)
};
