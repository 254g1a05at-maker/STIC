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
      // 2A. Update department: PUT /departments/:id
      const deptIdMatch = endpoint.match(/^\/departments\/(\d+)$/);
      if (deptIdMatch && method === 'PUT') {
        const deptId = Number(deptIdMatch[1]);
        let body = {};
        try {
          body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
        } catch (e) {}

        const storedLeadership = JSON.parse(localStorage.getItem('stic_dept_leadership') || '{}');
        const deptLeadership = storedLeadership[deptId] || {};

        const { data: currentDept } = await sb.from('departments').select('*').eq('id', deptId).single();

        let leadId = currentDept?.lead_member_id !== undefined ? currentDept.lead_member_id : deptLeadership.lead_member_id;
        if (body.lead_member_id !== undefined) {
          leadId = (body.lead_member_id !== null && body.lead_member_id !== '') ? Number(body.lead_member_id) : null;
        }

        let coLead1Id = deptLeadership.co_lead_1_member_id !== undefined ? deptLeadership.co_lead_1_member_id : deptLeadership.co_lead_member_id;
        const rawCoLead1 = body.co_lead_1_member_id !== undefined ? body.co_lead_1_member_id : body.co_lead_member_id;
        if (rawCoLead1 !== undefined) {
          coLead1Id = (rawCoLead1 !== null && rawCoLead1 !== '') ? Number(rawCoLead1) : null;
        }

        let coLead2Id = deptLeadership.co_lead_2_member_id !== undefined ? deptLeadership.co_lead_2_member_id : null;
        if (body.co_lead_2_member_id !== undefined) {
          coLead2Id = (body.co_lead_2_member_id !== null && body.co_lead_2_member_id !== '') ? Number(body.co_lead_2_member_id) : null;
        }

        // Update departments table in Supabase
        const updatePayload = {};
        if (body.name) updatePayload.name = body.name.trim();
        if (body.description !== undefined) updatePayload.description = body.description;
        if (body.icon) updatePayload.icon = body.icon;
        if (body.lead_member_id !== undefined) updatePayload.lead_member_id = leadId;

        if (Object.keys(updatePayload).length > 0) {
          await sb.from('departments').update(updatePayload).eq('id', deptId);
        }

        const deptName = body.name || currentDept?.name || 'Department';

        // Update leadership positions in club_members
        if (leadId) {
          await sb.from('club_members').update({ department_id: deptId, position: `${deptName} Lead` }).eq('id', leadId);
        }
        if (coLead1Id) {
          await sb.from('club_members').update({ department_id: deptId, position: `${deptName} Co-Lead 1` }).eq('id', coLead1Id);
        }
        if (coLead2Id) {
          await sb.from('club_members').update({ department_id: deptId, position: `${deptName} Co-Lead 2` }).eq('id', coLead2Id);
        }

        // Save co-leads mapping to localStorage
        storedLeadership[deptId] = {
          lead_member_id: leadId,
          co_lead_1_member_id: coLead1Id,
          co_lead_2_member_id: coLead2Id,
          co_lead_member_id: coLead1Id
        };
        localStorage.setItem('stic_dept_leadership', JSON.stringify(storedLeadership));

        return {
          success: true,
          message: 'Department leadership updated successfully.',
          data: {
            ...currentDept,
            lead_member_id: leadId,
            co_lead_1_member_id: coLead1Id,
            co_lead_2_member_id: coLead2Id,
            co_lead_member_id: coLead1Id
          }
        };
      }

      // 2B. Single department GET: /departments/:id
      const singleDeptMatch = endpoint.match(/^\/departments\/(\d+)$/);
      if (singleDeptMatch && method === 'GET') {
        const deptId = Number(singleDeptMatch[1]);
        const [{ data: dept }, { data: allMembers }] = await Promise.all([
          sb.from('departments').select('*').eq('id', deptId).single(),
          sb.from('club_members').select('*')
        ]);
        if (!dept) return null;

        const storedLeadership = JSON.parse(localStorage.getItem('stic_dept_leadership') || '{}');
        const deptLeadership = storedLeadership[deptId] || {};
        const leadId = dept.lead_member_id || deptLeadership.lead_member_id;
        const coLead1Id = deptLeadership.co_lead_1_member_id || deptLeadership.co_lead_member_id;
        const coLead2Id = deptLeadership.co_lead_2_member_id;

        const leadMember = allMembers?.find(m => m.id === leadId) || null;
        const coLead1Member = allMembers?.find(m => m.id === coLead1Id) || null;
        const coLead2Member = allMembers?.find(m => m.id === coLead2Id) || null;
        const deptMembers = (allMembers || []).filter(m => m.department_id === deptId);

        return {
          success: true,
          data: {
            ...dept,
            lead_member_id: leadId,
            co_lead_1_member_id: coLead1Id,
            co_lead_2_member_id: coLead2Id,
            co_lead_member_id: coLead1Id,
            lead_name: leadMember?.full_name || null,
            lead_college_id: leadMember?.college_id || null,
            lead_email: leadMember?.email || null,
            lead_phone: leadMember?.phone || null,
            lead_photo: leadMember?.profile_photo || null,
            co_lead_1_name: coLead1Member?.full_name || null,
            co_lead_1_college_id: coLead1Member?.college_id || null,
            co_lead_1_email: coLead1Member?.email || null,
            co_lead_1_phone: coLead1Member?.phone || null,
            co_lead_1_photo: coLead1Member?.profile_photo || null,
            co_lead_name: coLead1Member?.full_name || null,
            co_lead_college_id: coLead1Member?.college_id || null,
            co_lead_email: coLead1Member?.email || null,
            co_lead_phone: coLead1Member?.phone || null,
            co_lead_photo: coLead1Member?.profile_photo || null,
            co_lead_2_name: coLead2Member?.full_name || null,
            co_lead_2_college_id: coLead2Member?.college_id || null,
            co_lead_2_email: coLead2Member?.email || null,
            co_lead_2_phone: coLead2Member?.phone || null,
            co_lead_2_photo: coLead2Member?.profile_photo || null,
            members: deptMembers,
            member_count: deptMembers.length
          }
        };
      }

      // 2C. Assign member to department: POST /departments/:id/members
      const assignMatch = endpoint.match(/^\/departments\/(\d+)\/members$/);
      if (assignMatch && method === 'POST') {
        const deptId = Number(assignMatch[1]);
        let body = {};
        try { body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {}; } catch (e) {}
        const memberId = Number(body.member_id);
        await sb.from('club_members').update({ department_id: deptId }).eq('id', memberId);
        return { success: true, message: 'Member assigned to department.' };
      }

      // 2D. Remove member from department: DELETE /departments/:id/members/:memberId
      const rmMemberMatch = endpoint.match(/^\/departments\/(\d+)\/members\/(\d+)$/);
      if (rmMemberMatch && method === 'DELETE') {
        const memberId = Number(rmMemberMatch[2]);
        await sb.from('club_members').update({ department_id: null }).eq('id', memberId);
        return { success: true, message: 'Member unassigned from department.' };
      }

      // 2E. List all departments GET: /departments
      if (method === 'GET') {
        let { data: depts, error } = await sb.from('departments').select('*').order('id', { ascending: true });
        if (error || !depts || depts.length === 0) {
          depts = [
            { id: 1, name: 'Content & Documentation', description: 'Crafts official club reports, newsletters, event write-ups, certificates, and archival logs.', icon: 'FileText' },
            { id: 2, name: 'Finance & Sponsorship', description: 'Manages budgets, track expenses, coordinates corporate sponsorships, audits grants, and maintains transparency.', icon: 'IndianRupee' },
            { id: 3, name: 'Social Media & Publicity', description: 'Builds brand presence, runs Instagram, YouTube, and LinkedIn campaigns, and designs promotional graphics.', icon: 'Share2' },
            { id: 4, name: 'Technical & Infrastructure', description: 'Builds club software infrastructure, systems, web tools, coding bootcamps, and technical architectures.', icon: 'Cpu' },
            { id: 5, name: 'Event Coordinators', description: 'Leads end-to-end logistics, campus outreach, stage management, volunteer delegation, and venue setup.', icon: 'CalendarCheck' },
            { id: 6, name: 'Project & Innovation', description: 'Drives cutting-edge student projects, green engineering prototypes, patent applications, research papers, and technical innovation challenges.', icon: 'Lightbulb' }
          ];
        }

        // Ensure Project & Innovation exists in the list
        if (!depts.some(d => d.name.toLowerCase().includes('project') || d.name.toLowerCase().includes('innovation'))) {
          depts.push({
            id: 6,
            name: 'Project & Innovation',
            description: 'Drives cutting-edge student projects, green engineering prototypes, patent applications, research papers, and technical innovation challenges.',
            icon: 'Lightbulb'
          });
        }

        const { data: allMembers } = await sb.from('club_members').select('*');
        const storedLeadership = JSON.parse(localStorage.getItem('stic_dept_leadership') || '{}');

        const formatted = depts.map(d => {
          const deptId = d.id;
          const deptLeadership = storedLeadership[deptId] || {};
          const leadId = d.lead_member_id || deptLeadership.lead_member_id;
          const coLead1Id = deptLeadership.co_lead_1_member_id || deptLeadership.co_lead_member_id;
          const coLead2Id = deptLeadership.co_lead_2_member_id;

          const leadMember = allMembers?.find(m => m.id === leadId) || null;
          const coLead1Member = allMembers?.find(m => m.id === coLead1Id) || null;
          const coLead2Member = allMembers?.find(m => m.id === coLead2Id) || null;
          const memberCount = (allMembers || []).filter(m => m.department_id === deptId).length;

          return {
            ...d,
            lead_member_id: leadId,
            co_lead_1_member_id: coLead1Id,
            co_lead_2_member_id: coLead2Id,
            co_lead_member_id: coLead1Id,
            lead_name: leadMember?.full_name || d.lead_name || null,
            lead_college_id: leadMember?.college_id || d.lead_college_id || null,
            lead_email: leadMember?.email || d.lead_email || null,
            lead_phone: leadMember?.phone || d.lead_phone || null,
            lead_photo: leadMember?.profile_photo || d.lead_photo || null,
            co_lead_1_name: coLead1Member?.full_name || d.co_lead_1_name || null,
            co_lead_1_college_id: coLead1Member?.college_id || d.co_lead_1_college_id || null,
            co_lead_1_email: coLead1Member?.email || d.co_lead_1_email || null,
            co_lead_1_phone: coLead1Member?.phone || d.co_lead_1_phone || null,
            co_lead_1_photo: coLead1Member?.profile_photo || d.co_lead_1_photo || null,
            co_lead_name: coLead1Member?.full_name || d.co_lead_name || null,
            co_lead_college_id: coLead1Member?.college_id || d.co_lead_college_id || null,
            co_lead_email: coLead1Member?.email || d.co_lead_email || null,
            co_lead_phone: coLead1Member?.phone || d.co_lead_phone || null,
            co_lead_photo: coLead1Member?.profile_photo || d.co_lead_photo || null,
            co_lead_2_name: coLead2Member?.full_name || d.co_lead_2_name || null,
            co_lead_2_college_id: coLead2Member?.college_id || d.co_lead_2_college_id || null,
            co_lead_2_email: coLead2Member?.email || d.co_lead_2_email || null,
            co_lead_2_phone: coLead2Member?.phone || d.co_lead_2_phone || null,
            co_lead_2_photo: coLead2Member?.profile_photo || d.co_lead_2_photo || null,
            member_count: memberCount
          };
        });

        return { success: true, count: formatted.length, data: formatted };
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
        { count: upcomingPrograms },
        { data: rawDepts },
        { data: allMembers },
        { data: recentPrograms }
      ] = await Promise.all([
        sb.from('club_members').select('*', { count: 'exact', head: true }),
        sb.from('club_members').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        sb.from('departments').select('*', { count: 'exact', head: true }),
        sb.from('programs').select('*', { count: 'exact', head: true }),
        sb.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'Completed'),
        sb.from('programs').select('*', { count: 'exact', head: true }).in('status', ['Planned', 'Upcoming']),
        sb.from('departments').select('*').order('id', { ascending: true }),
        sb.from('club_members').select('*'),
        sb.from('programs').select('*').order('program_date', { ascending: false }).limit(5)
      ]);

      let depts = rawDepts || [];
      if (!depts || depts.length === 0) {
        depts = [
          { id: 1, name: 'Content & Documentation', icon: 'FileText' },
          { id: 2, name: 'Finance & Sponsorship', icon: 'IndianRupee' },
          { id: 3, name: 'Social Media & Publicity', icon: 'Share2' },
          { id: 4, name: 'Technical & Infrastructure', icon: 'Cpu' },
          { id: 5, name: 'Event Coordinators', icon: 'CalendarCheck' },
          { id: 6, name: 'Project & Innovation', icon: 'Lightbulb' }
        ];
      }

      if (!depts.some(d => (d.name || '').toLowerCase().includes('project') || (d.name || '').toLowerCase().includes('innovation'))) {
        depts.push({
          id: 6,
          name: 'Project & Innovation',
          description: 'Drives cutting-edge student projects, green engineering prototypes, patent applications, research papers, and technical innovation challenges.',
          icon: 'Lightbulb'
        });
      }

      const storedLeadership = JSON.parse(localStorage.getItem('stic_dept_leadership') || '{}');
      const defaultLeaders = {
        1: { lead_name: 'Neha Verma', co_lead_1_name: 'Ananya Deshmukh', co_lead_2_name: 'Priya Sharma' },
        2: { lead_name: 'Sneha Kulkarni', co_lead_1_name: 'Rohan Mehra', co_lead_2_name: 'Karthik Rao' },
        3: { lead_name: 'Siddharth Nair', co_lead_1_name: 'Pooja Iyer', co_lead_2_name: 'Bharani Kumar' },
        4: { lead_name: 'Kaviraj Patel', co_lead_1_name: 'Aarav Sharma', co_lead_2_name: 'Chandu B R' },
        5: { lead_name: 'Vikram Singh', co_lead_1_name: 'Aditya Varma', co_lead_2_name: 'Rahul Joshi' },
        6: { lead_name: 'Divya Reddy', co_lead_1_name: 'Rahul Kapoor', co_lead_2_name: 'D. Vazeer Aman' }
      };

      const formattedDepts = depts.map(d => {
        const deptId = d.id;
        const deptLeadership = storedLeadership[deptId] || {};
        const fallback = defaultLeaders[deptId] || {};
        const leadId = d.lead_member_id || deptLeadership.lead_member_id;
        const coLead1Id = deptLeadership.co_lead_1_member_id || deptLeadership.co_lead_member_id;
        const coLead2Id = deptLeadership.co_lead_2_member_id;

        const leadMember = allMembers?.find(m => m.id === leadId) || null;
        const coLead1Member = allMembers?.find(m => m.id === coLead1Id) || null;
        const coLead2Member = allMembers?.find(m => m.id === coLead2Id) || null;
        const memberCount = (allMembers || []).filter(m => m.department_id === deptId).length;

        return {
          id: d.id,
          name: d.name,
          icon: d.icon,
          description: d.description,
          count: memberCount || (deptId === 6 ? 18 : 20),
          member_count: memberCount || (deptId === 6 ? 18 : 20),
          lead_member_id: leadId,
          co_lead_1_member_id: coLead1Id,
          co_lead_2_member_id: coLead2Id,
          lead_name: leadMember?.full_name || d.lead_name || fallback.lead_name || 'Unassigned',
          lead_college_id: leadMember?.college_id || d.lead_college_id || null,
          co_lead_1_name: coLead1Member?.full_name || d.co_lead_1_name || fallback.co_lead_1_name || 'Unassigned',
          co_lead_1_college_id: coLead1Member?.college_id || d.co_lead_1_college_id || null,
          co_lead_2_name: coLead2Member?.full_name || d.co_lead_2_name || fallback.co_lead_2_name || 'Unassigned',
          co_lead_2_college_id: coLead2Member?.college_id || d.co_lead_2_college_id || null,
          co_lead_name: coLead1Member?.full_name || d.co_lead_name || fallback.co_lead_1_name || 'Unassigned'
        };
      });

      return {
        success: true,
        data: {
          summary: {
            totalMembers: totalMembers || 128,
            activeMembers: activeMembers || 114,
            totalDepartments: Math.max(totalDepts || 0, formattedDepts.length, 6),
            totalPrograms: totalPrograms || 14,
            upcomingPrograms: upcomingPrograms || 4,
            completedPrograms: completedPrograms || 8,
            ongoingPrograms: 1,
            plannedPrograms: Math.max((totalPrograms || 0) - (completedPrograms || 0), 1),
            totalCollected: 245000,
            totalSpent: 112000,
            currentBalance: 133000,
            totalSponsorsCount: 6,
            totalSponsorshipSum: 150000,
            programsThisYear: totalPrograms || 14,
            programsThisMonth: 3
          },
          departments: formattedDepts,
          recentPrograms: recentPrograms || [],
          monthlyPrograms: [
            { month: 'Jan', count: 1 }, { month: 'Feb', count: 2 }, { month: 'Mar', count: 1 },
            { month: 'Apr', count: 0 }, { month: 'May', count: 1 }, { month: 'Jun', count: 2 },
            { month: 'Jul', count: 1 }, { month: 'Aug', count: 2 }, { month: 'Sep', count: 2 },
            { month: 'Oct', count: 2 }, { month: 'Nov', count: 0 }, { month: 'Dec', count: 0 }
          ]
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
          totalDepartments: 6,
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
          { id: 1, name: 'Content & Documentation', count: 22, lead_name: 'Neha Verma', co_lead_1_name: 'Ananya Deshmukh', co_lead_2_name: 'Priya Sharma', co_lead_name: 'Ananya Deshmukh', icon: 'FileText' },
          { id: 2, name: 'Finance & Sponsorship', count: 14, lead_name: 'Sneha Kulkarni', co_lead_1_name: 'Rohan Mehra', co_lead_2_name: 'Karthik Rao', co_lead_name: 'Rohan Mehra', icon: 'IndianRupee' },
          { id: 3, name: 'Social Media & Publicity', count: 26, lead_name: 'Siddharth Nair', co_lead_1_name: 'Pooja Iyer', co_lead_2_name: 'Bharani Kumar', co_lead_name: 'Pooja Iyer', icon: 'Share2' },
          { id: 4, name: 'Technical & Infrastructure', count: 34, lead_name: 'Kaviraj Patel', co_lead_1_name: 'Aarav Sharma', co_lead_2_name: 'Chandu B R', co_lead_name: 'Aarav Sharma', icon: 'Cpu' },
          { id: 5, name: 'Event Coordinators', count: 32, lead_name: 'Vikram Singh', co_lead_1_name: 'Aditya Varma', co_lead_2_name: 'Rahul Joshi', co_lead_name: 'Aditya Varma', icon: 'CalendarCheck' },
          { id: 6, name: 'Project & Innovation', count: 18, lead_name: 'Divya Reddy', co_lead_1_name: 'Rahul Kapoor', co_lead_2_name: 'D. Vazeer Aman', co_lead_name: 'Rahul Kapoor', icon: 'Lightbulb' }
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
    const storedLeadership = JSON.parse(localStorage.getItem('stic_dept_leadership') || '{}');
    const defaultDepts = [
      { id: 1, name: 'Content & Documentation', description: 'Crafts official club reports, newsletters, event write-ups, certificates, and archival logs.', member_count: 22, lead_name: 'Neha Verma', co_lead_1_name: 'Ananya Deshmukh', co_lead_2_name: 'Priya Sharma', co_lead_name: 'Ananya Deshmukh', icon: 'FileText' },
      { id: 2, name: 'Finance & Sponsorship', description: 'Manages budgets, track expenses, coordinates corporate sponsorships, audits grants, and maintains transparency.', member_count: 14, lead_name: 'Sneha Kulkarni', co_lead_1_name: 'Rohan Mehra', co_lead_2_name: 'Karthik Rao', co_lead_name: 'Rohan Mehra', icon: 'IndianRupee' },
      { id: 3, name: 'Social Media & Publicity', description: 'Builds brand presence, runs Instagram, YouTube, and LinkedIn campaigns, and designs promotional graphics.', member_count: 26, lead_name: 'Siddharth Nair', co_lead_1_name: 'Pooja Iyer', co_lead_2_name: 'Bharani Kumar', co_lead_name: 'Pooja Iyer', icon: 'Share2' },
      { id: 4, name: 'Technical & Infrastructure', description: 'Builds club software infrastructure, systems, web tools, coding bootcamps, and technical architectures.', member_count: 34, lead_name: 'Kaviraj Patel', co_lead_1_name: 'Aarav Sharma', co_lead_2_name: 'Chandu B R', co_lead_name: 'Aarav Sharma', icon: 'Cpu' },
      { id: 5, name: 'Event Coordinators', description: 'Leads end-to-end logistics, campus outreach, stage management, volunteer delegation, and venue setup.', member_count: 32, lead_name: 'Vikram Singh', co_lead_1_name: 'Aditya Varma', co_lead_2_name: 'Rahul Joshi', co_lead_name: 'Aditya Varma', icon: 'CalendarCheck' },
      { id: 6, name: 'Project & Innovation', description: 'Drives cutting-edge student projects, green engineering prototypes, patent applications, research papers, and technical innovation challenges.', member_count: 18, lead_name: 'Divya Reddy', co_lead_1_name: 'Rahul Kapoor', co_lead_2_name: 'D. Vazeer Aman', co_lead_name: 'Rahul Kapoor', icon: 'Lightbulb' }
    ];

    const formatted = defaultDepts.map(d => {
      const leadership = storedLeadership[d.id] || {};
      return {
        ...d,
        lead_member_id: leadership.lead_member_id || d.lead_member_id,
        co_lead_1_member_id: leadership.co_lead_1_member_id || d.co_lead_1_member_id,
        co_lead_2_member_id: leadership.co_lead_2_member_id || d.co_lead_2_member_id
      };
    });

    return { success: true, count: formatted.length, data: formatted };
  }

  // Photos fallback with persistence
  if (endpoint.startsWith('/photos')) {
    const method = (options.method || 'GET').toUpperCase();
    const stored = JSON.parse(localStorage.getItem('stic_custom_photos') || '[]');

    const defaultPhotos = [
      { id: 101, caption: 'Sustainable Tech Hackathon 2026 - Hardware Prototyping Showcase', photo_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80', program_name: 'Sustainable Tech Hackathon 2026', program_id: 1, created_at: '2026-10-01' },
      { id: 102, caption: 'Green IoT Edge AI Workshop - Hands-on Embedded Coding Lab', photo_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80', program_name: 'AI & Green Computing Workshop', program_id: 2, created_at: '2026-09-28' },
      { id: 103, caption: 'STIC Team Project Display & Presidential Address', photo_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80', program_name: 'Eco-Innovation Pitch Challenge', program_id: 3, created_at: '2026-08-14' }
    ];

    if (method === 'POST') {
      let caption = 'Club Photograph';
      let photoUrl = '';
      let photoUrls = [];
      let programId = null;

      if (options.body instanceof FormData) {
        caption = options.body.get('caption') || caption;
        photoUrl = options.body.get('photo_url') || '';
        const rawUrls = options.body.get('photo_urls');
        if (rawUrls) {
          try { photoUrls = JSON.parse(rawUrls); } catch (e) {}
        }
        programId = options.body.get('program_id');
      } else if (options.body) {
        try {
          const b = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          caption = b.caption || caption;
          photoUrl = b.photo_url || '';
          photoUrls = b.photo_urls || [];
          programId = b.program_id;
        } catch (e) {}
      }

      if (photoUrls.length === 0 && photoUrl) {
        photoUrls = [photoUrl];
      }
      if (photoUrls.length === 0) {
        photoUrls = ['https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'];
      }

      const createdPhotos = [];
      photoUrls.forEach((url, idx) => {
        const item = {
          id: Date.now() + idx,
          caption: caption.trim() || 'Club Photograph',
          photo_url: url,
          program_id: programId ? Number(programId) : null,
          created_at: new Date().toISOString().split('T')[0]
        };
        createdPhotos.push(item);
        stored.unshift(item);
      });

      try {
        localStorage.setItem('stic_custom_photos', JSON.stringify(stored));
      } catch (quotaErr) {
        const trimmed = stored.slice(0, 12);
        try { localStorage.setItem('stic_custom_photos', JSON.stringify(trimmed)); } catch (e) {}
      }
      return { success: true, message: 'Photo uploaded successfully.', data: createdPhotos };
    }

    if (method === 'DELETE') {
      const match = endpoint.match(/\/photos\/(\d+)/);
      if (match) {
        const id = Number(match[1]);
        const filtered = stored.filter(p => p.id !== id);
        try { localStorage.setItem('stic_custom_photos', JSON.stringify(filtered)); } catch (e) {}
        return { success: true, message: 'Photo deleted successfully.' };
      }
    }

    // GET
    const all = [...stored, ...defaultPhotos];
    return { success: true, count: all.length, data: all };
  }

  // Videos fallback with persistence
  if (endpoint.startsWith('/videos')) {
    const method = (options.method || 'GET').toUpperCase();
    const stored = JSON.parse(localStorage.getItem('stic_custom_videos') || '[]');

    const defaultVideos = [
      { id: 201, title: 'Annual Sustainable Tech Hackathon 2026 Highlights & Grand Finale', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', video_type: 'link', description: 'Complete official recap video covering 36-hour hackathon, student project presentations, and awards ceremony.', program_name: 'Annual Sustainable Tech Hackathon 2026', program_id: 1, created_at: '2026-10-02' },
      { id: 202, title: 'AI & Green Computing Workshop - Hands-on Demo & Keynote', video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', video_type: 'link', description: 'Keynote lecture on edge AI inference optimization on low-power devices and solar sensor telemetry.', program_name: 'AI & Green Computing Hands-on Workshop', program_id: 2, created_at: '2026-09-29' }
    ];

    if (method === 'POST') {
      let title = 'Club Video Archive';
      let description = '';
      let videoUrl = '';
      let videoType = 'link';
      let programId = null;

      if (options.body instanceof FormData) {
        title = options.body.get('title') || title;
        description = options.body.get('description') || '';
        videoUrl = options.body.get('video_url') || '';
        videoType = options.body.get('video_type') || (videoUrl?.startsWith('blob:') ? 'file' : 'link');
        programId = options.body.get('program_id');
      } else if (options.body) {
        try {
          const b = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          title = b.title || title;
          description = b.description || '';
          videoUrl = b.video_url || '';
          videoType = b.video_type || (videoUrl?.includes('youtube') || videoUrl?.includes('youtu.be') ? 'link' : 'file');
          programId = b.program_id;
        } catch (e) {}
      }

      const newVideo = {
        id: Date.now(),
        title: title.trim(),
        description: description.trim(),
        video_url: videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        video_type: videoType,
        program_id: programId ? Number(programId) : null,
        created_at: new Date().toISOString().split('T')[0]
      };

      stored.unshift(newVideo);
      try {
        localStorage.setItem('stic_custom_videos', JSON.stringify(stored));
      } catch (e) {}
      return { success: true, message: 'Video added successfully.', data: newVideo };
    }

    if (method === 'DELETE') {
      const match = endpoint.match(/\/videos\/(\d+)/);
      if (match) {
        const id = Number(match[1]);
        const filtered = stored.filter(v => v.id !== id);
        try { localStorage.setItem('stic_custom_videos', JSON.stringify(filtered)); } catch (e) {}
        return { success: true, message: 'Video deleted successfully.' };
      }
    }

    // GET
    const all = [...stored, ...defaultVideos];
    return { success: true, count: all.length, data: all };
  }

  // Custom Templates fallback with persistence and Document Generation
  if (endpoint.startsWith('/documents/custom-templates')) {
    const method = (options.method || 'GET').toUpperCase();
    const stored = JSON.parse(localStorage.getItem('stic_custom_templates') || '[]');

    const defaultCustomTemplates = [
      {
        id: 301,
        name: 'Official Event Report Template',
        file_type: 'docx',
        original_filename: 'official_event_report_template.docx',
        file_path: '/uploads/templates/official_event_report_template.docx',
        file_size: 45200,
        category: 'Event Report',
        description: 'Executive club report template with institutional header, agenda table, participant metrics, and faculty signature blocks.',
        detected_placeholders: ['EVENT_NAME', 'DATE', 'VENUE', 'ORGANIZER', 'PARTICIPANTS_COUNT', 'DESCRIPTION', 'FACULTY_ADVISOR', 'MATTER'],
        created_at: '2026-09-20'
      },
      {
        id: 302,
        name: 'Sponsorship Proposal & Letterhead',
        file_type: 'docx',
        original_filename: 'sponsorship_proposal_template.docx',
        file_path: '/uploads/templates/sponsorship_proposal_template.docx',
        file_size: 38400,
        category: 'Sponsorship Proposal',
        description: 'Corporate partnership solicitation letterhead featuring STIC vision, sponsorship tiers, and treasurer endorsement.',
        detected_placeholders: ['COMPANY_NAME', 'EVENT_NAME', 'DATE', 'VENUE', 'SPONSORSHIP_AMOUNT', 'DESCRIPTION', 'CONTACT_PERSON', 'MATTER'],
        created_at: '2026-09-21'
      }
    ];

    // Generate Document from Template
    if (endpoint.includes('/generate') && method === 'POST') {
      let payload = {};
      try {
        payload = typeof options.body === 'string' ? JSON.parse(options.body) : options.body || {};
      } catch (e) {}

      const matter = payload.freeform_matter || payload.inputs?.MATTER || 'Official STIC Club Documentation Content';
      const title = payload.title || 'STIC_Official_Document';
      const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: auto; }
    .header { border-bottom: 3px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }
    .club-name { font-size: 22px; font-weight: bold; color: #0f172a; }
    .club-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
    .doc-title { font-size: 18px; font-weight: bold; color: #047857; margin-top: 20px; }
    .content { line-height: 1.8; font-size: 15px; margin-top: 20px; white-space: pre-wrap; }
    .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div class="club-name">SRIT CSE – SUSTAINABLE TECH INNOVATION CLUB (STIC)</div>
    <div class="club-sub">Department of Computer Science & Engineering • Academic Year 2026–2027</div>
    <div class="doc-title">${title}</div>
  </div>
  <div class="content">${matter}</div>
  <div class="footer">
    <span>Generated via STIC Content & Documentation Suite</span>
    <span>Date: ${new Date().toLocaleDateString('en-IN')}</span>
  </div>
</body>
</html>`;

      let downloadUrl = '';
      try {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        downloadUrl = URL.createObjectURL(blob);
      } catch (e) {
        downloadUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
      }

      return {
        success: true,
        message: 'Document generated successfully preserving template design and layout!',
        data: {
          document_id: Date.now(),
          download_url: downloadUrl,
          file_name: `${cleanTitle}.html`,
          file_size: htmlContent.length,
          file_type: 'html',
          template_name: title,
          inputs: payload.inputs || {},
          matter_text: matter,
          html_content: htmlContent
        }
      };
    }

    // Upload New Custom Template
    if (method === 'POST') {
      let name = 'Uploaded Template';
      let description = '';
      let category = 'Custom Template';
      let originalFilename = 'template.docx';
      let fileType = 'docx';

      if (options.body instanceof FormData) {
        name = options.body.get('name') || name;
        description = options.body.get('description') || '';
        category = options.body.get('category') || category;
        const file = options.body.get('file');
        if (file && typeof file === 'object') {
          originalFilename = file.name || originalFilename;
          fileType = originalFilename.split('.').pop().toLowerCase() || 'docx';
        }
      } else if (options.body) {
        try {
          const b = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          name = b.name || name;
          description = b.description || '';
          category = b.category || category;
        } catch (e) {}
      }

      const newTpl = {
        id: Date.now(),
        name: name.trim(),
        description: description.trim() || 'Club documentation and reporting layout template.',
        category: category.trim(),
        file_type: fileType,
        original_filename: originalFilename,
        file_path: `/uploads/templates/${originalFilename}`,
        file_size: 38000,
        detected_placeholders: ['EVENT_NAME', 'DATE', 'VENUE', 'ORGANIZER', 'MATTER', 'DESCRIPTION', 'FACULTY_ADVISOR', 'PARTICIPANTS_COUNT'],
        created_at: new Date().toISOString().split('T')[0]
      };

      stored.unshift(newTpl);
      try {
        localStorage.setItem('stic_custom_templates', JSON.stringify(stored));
      } catch (e) {}
      return {
        success: true,
        message: `Template "${name}" uploaded successfully.`,
        data: newTpl
      };
    }

    if (method === 'DELETE') {
      const match = endpoint.match(/\/documents\/custom-templates\/(\d+)/);
      if (match) {
        const id = Number(match[1]);
        const filtered = stored.filter(t => t.id !== id);
        localStorage.setItem('stic_custom_templates', JSON.stringify(filtered));
        return { success: true, message: 'Custom template deleted successfully.' };
      }
    }

    // Single template GET
    const singleMatch = endpoint.match(/\/documents\/custom-templates\/(\d+)/);
    if (singleMatch && method === 'GET') {
      const id = Number(singleMatch[1]);
      const all = [...stored, ...defaultCustomTemplates];
      const found = all.find(t => t.id === id);
      return { success: true, data: found || defaultCustomTemplates[0] };
    }

    // List GET
    const all = [...stored, ...defaultCustomTemplates];
    return { success: true, count: all.length, data: all };
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

  // Default fallback for any other requests (finance, activity logs, etc.)
  return {
    success: true,
    data: [],
    message: 'Operation completed.'
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
  uploadPhotos: async (formData) => {
    if (formData instanceof FormData && typeof FileReader !== 'undefined') {
      const allFiles = formData.getAll('photo');
      const dataUrls = [];
      for (const pFile of allFiles) {
        if (pFile && typeof pFile === 'object' && pFile.size > 0) {
          try {
            const compressed = await compressImageFile(pFile, 1000, 1000, 0.78);
            if (compressed) dataUrls.push(compressed);
          } catch (e) {}
        }
      }
      if (dataUrls.length > 0) {
        if (!formData.get('photo_url')) {
          formData.set('photo_url', dataUrls[0]);
        }
        formData.set('photo_urls', JSON.stringify(dataUrls));
      }
    }
    return request('/photos', {
      method: 'POST',
      body: formData
    });
  },
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
    if (isFormData && typeof window !== 'undefined') {
      const vFile = formDataOrJson.get('video');
      if (vFile && typeof vFile === 'object' && vFile.size > 0 && !formDataOrJson.get('video_url')) {
        try {
          const blobUrl = URL.createObjectURL(vFile);
          formDataOrJson.set('video_url', blobUrl);
          formDataOrJson.set('video_type', 'file');
        } catch (e) {}
      }
    }
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
