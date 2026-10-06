import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Building2,
  Award,
  BookOpen,
  LayoutGrid,
  List,
  CheckCircle,
  XCircle,
  X,
  Eye,
  Sparkles,
  Camera,
  Image,
  UserMinus
} from 'lucide-react';
import { api, authState } from '../api';

export const REPRESENTATIVE_POSITIONS = [
  'President',
  'Co-President',
  'Vice President',
  'Co-Vice President',
  'General Secretary',
  'Secretary',
  'Project & Innovation Lead',
  'Project & Innovation Co-Lead',
  'Technical Lead',
  'Technical Co-Lead',
  'Content & Documentation Lead',
  'Content & Documentation Co-Lead',
  'Social Media & PR Lead',
  'Social Media Co-Lead',
  'Finance & Treasurer Lead',
  'Finance Co-Lead',
  'Event Management Lead',
  'Event Management Co-Lead',
  'Event Coordinator'
];

export const getRoleRank = (pos = '') => {
  const p = (pos || '').trim().toLowerCase();
  if (!p) return 999;
  if (p === 'president') return 0;
  if (p.includes('co-president') || p.includes('co - president')) return 1;
  if (p === 'vice president') return 2;
  if (p.includes('co-vice president') || p.includes('co - vice president') || p === 'covp') return 3;
  if (p.includes('secretary')) return 4;
  if (p.includes('project') || p.includes('innovation')) {
    if (p.includes('co-lead') || p.includes('co lead')) return 5.5;
    return 5.1;
  }
  if (p.includes('technical') || p.includes('tech lead')) {
    if (p.includes('co-lead') || p.includes('co lead')) return 6.5;
    return 6;
  }
  if (p.includes('content') || p.includes('editorial') || (p.includes('documentation') && p.includes('lead'))) {
    if (p.includes('co-lead') || p.includes('co lead')) return 7.5;
    return 7;
  }
  if (p.includes('social') || p.includes('publicity') || p.includes('pr lead')) {
    if (p.includes('co-lead') || p.includes('co lead')) return 8.5;
    return 8;
  }
  if (p.includes('finance') || p.includes('treasurer')) {
    if (p.includes('co-lead') || p.includes('co lead')) return 9.5;
    return 9;
  }
  if (p.includes('event') || p.includes('coordinator') || p.includes('manager')) {
    if (p.includes('co-lead') || p.includes('co lead')) return 10.5;
    return 10;
  }
  return 999;
};

export const isRepresentativeRole = (pos = '') => getRoleRank(pos) < 999;

export const getRoleDetails = (position = '') => {
  const p = (position || '').trim().toLowerCase();

  // 1st Role: President
  if (p === 'president') {
    return {
      supportsTag: null,
      duties: [
        'Lead club; coordinate activities',
        'Plan semester schedule',
        'Conduct meetings',
        'Represent the club'
      ]
    };
  }

  // Co-President: Supports President
  if (p === 'co-president' || p === 'co - president') {
    return {
      supportsTag: 'Supports President',
      duties: [
        'Support President',
        'Manage in absence',
        'Coordinate teams',
        'Ensure smooth execution'
      ]
    };
  }

  // 2nd Role: Vice President
  if (p === 'vice president') {
    return {
      supportsTag: null,
      duties: [
        'Lead club; coordinate activities',
        'Plan semester schedule',
        'Conduct meetings',
        'Represent the club'
      ]
    };
  }

  // Co-Vice President: Supports Vice President
  if (p === 'co-vice president' || p === 'co - vice president' || p === 'covp') {
    return {
      supportsTag: 'Supports Vice President',
      duties: [
        'Support Vice President',
        'Manage in absence',
        'Coordinate teams',
        'Ensure smooth execution'
      ]
    };
  }

  // 3rd Role: Secretary
  if (p === 'secretary' || p === 'general secretary') {
    return {
      supportsTag: null,
      duties: [
        'Maintain minutes and attendance',
        'Prepare event reports and documentation',
        'Handle official communication',
        'Keep records and archives'
      ]
    };
  }

  // Project & Innovation Lead
  if ((p.includes('project') || p.includes('innovation')) && p.includes('lead') && !p.includes('co-lead') && !p.includes('co lead')) {
    return {
      supportsTag: null,
      duties: [
        'Direct student hardware, IoT, AI & green sustainability projects',
        'Lead prototype incubations, campus trials & patent applications',
        'Mentor student hackathon teams and technical research papers'
      ]
    };
  }

  // Project & Innovation Co-Lead
  if ((p.includes('project') || p.includes('innovation')) && (p.includes('co-lead') || p.includes('co lead'))) {
    return {
      supportsTag: 'Supports Project & Innovation Lead',
      duties: [
        'Assist in tracking project milestones, lab equipment & components',
        'Support hackathon project teams and prototype demonstrations',
        'Coordinate project exhibitions, patent drafts and student mentorship'
      ]
    };
  }

  // 4th Role: Technical Lead
  if ((p.includes('technical') || p.includes('tech lead')) && !p.includes('co-lead') && !p.includes('co lead')) {
    return {
      supportsTag: null,
      duties: [
        'Conduct coding sessions / workshops',
        'Guide AI, Data, IoT, Cloud & Software projects',
        'Support hackathons and maintain resources'
      ]
    };
  }

  // Technical Co-Lead
  if ((p.includes('technical') || p.includes('tech lead')) && (p.includes('co-lead') || p.includes('co lead'))) {
    return {
      supportsTag: 'Supports Technical Lead',
      duties: [
        'Assist in software development and technical infrastructure maintenance',
        'Support hands-on coding sessions and hackathon environments',
        'Guide junior members on tools, frameworks and Git workflows'
      ]
    };
  }

  if (p.includes('content') && (p.includes('documentation') || p.includes('lead') || p.includes('editorial'))) {
    if (p.includes('co-lead') || p.includes('co lead')) {
      return {
        supportsTag: 'Supports Content & Documentation Lead',
        duties: [
          'Assist in compiling event briefs, newsletters and official circulars',
          'Coordinate document templates and review meeting minutes',
          'Maintain digital document archives and certificates'
        ]
      };
    }
    return {
      supportsTag: null,
      duties: [
        'Prepare event reports and documentation',
        'Maintain minutes, archives and publications',
        'Handle official club write-ups and editorial content'
      ]
    };
  }

  if (p.includes('social') && (p.includes('media') || p.includes('lead') || p.includes('publicity'))) {
    if (p.includes('co-lead') || p.includes('co lead')) {
      return {
        supportsTag: 'Supports Social Media Lead',
        duties: [
          'Assist in poster graphics, reel edits, and story updates',
          'Support social media captioning and event day live updates',
          'Organize photo and video media asset folders'
        ]
      };
    }
    return {
      supportsTag: null,
      duties: [
        'Digital branding, publicity & promotions',
        'Manage social media campaigns, reels and stories',
        'Maintain official photo & video public archives'
      ]
    };
  }

  if (p.includes('finance') || p.includes('treasurer')) {
    if (p.includes('co-lead') || p.includes('co lead')) {
      return {
        supportsTag: 'Supports Finance Lead',
        duties: [
          'Assist in invoice verification and expense receipt uploads',
          'Track vendor payments and balance reconciliation',
          'Support sponsorship outreach correspondence'
        ]
      };
    }
    return {
      supportsTag: null,
      duties: [
        'Manage club budgets, accounts and funds',
        'Track sponsorships and corporate partnerships',
        'Maintain income and expenditure ledgers'
      ]
    };
  }

  // 5th Role: All Event Coordinators / Event Managers
  if (p.includes('event') || p.includes('coordinator') || p.includes('manager')) {
    if (p.includes('co-lead') || p.includes('co lead')) {
      return {
        supportsTag: 'Supports Event Management Lead',
        duties: [
          'Assist in venue booking, participant check-in desks & certificates',
          'Coordinate stage sound, projector setup, and volunteers',
          'Ensure disciplined flow of events and guest hospitality'
        ]
      };
    }
    return {
      supportsTag: null,
      duties: [
        'Plan workshops, seminars and competitions',
        'Coordinate venue, registrations & volunteers',
        'Invite speakers and ensure smooth events'
      ]
    };
  }

  return {
    supportsTag: null,
    duties: [
      'Active contribution to club initiatives and projects',
      'Support club events, workshops and student outreach'
    ]
  };
};

export default function MembersView({ departments, showToast, openAddTrigger, onCloseAddTrigger }) {
  const user = authState.getUser();
  const canManageMembers = !user?.is_website_handler || Boolean(user?.permissions?.manage_members);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('full_name');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRepMode, setIsRepMode] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    college_id: '',
    email: '',
    phone: '',
    year: '2nd Year',
    branch: 'Computer Science & Engineering',
    section: '',
    position: 'Club Member',
    department_id: '',
    joining_date: new Date().toISOString().split('T')[0],
    status: 'Active',
    notes: '',
    profile_photo: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, [search, selectedDept, selectedYear, selectedSection, selectedStatus, sortBy, sortOrder]);

  useEffect(() => {
    if (openAddTrigger) {
      handleOpenAddModal();
      if (onCloseAddTrigger) onCloseAddTrigger();
    }
  }, [openAddTrigger]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedDept) params.department_id = selectedDept;
      if (selectedYear) params.year = selectedYear;
      if (selectedSection) params.section = selectedSection;
      if (selectedStatus) params.status = selectedStatus;
      if (sortBy) params.sort_by = sortBy;
      if (sortOrder) params.order = sortOrder;

      const res = await api.getMembers(params);
      setMembers(res.data || []);
    } catch (err) {
      showToast('error', 'Error fetching members', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setIsRepMode(false);
    setFormData({
      full_name: '',
      college_id: '',
      email: '',
      phone: '',
      year: '2nd Year',
      branch: 'Computer Science & Engineering',
      section: '',
      position: 'Club Member',
      department_id: '',
      joining_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      notes: '',
      profile_photo: ''
    });
    setAvatarFile(null);
    setIsFormOpen(true);
  };

  const handleOpenAddRepresentativeModal = () => {
    setEditingMember(null);
    setIsRepMode(true);
    setFormData({
      full_name: '',
      college_id: '',
      email: '',
      phone: '',
      year: '3rd Year',
      branch: 'Computer Science & Engineering',
      section: '',
      position: 'Vice President',
      department_id: '',
      joining_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      notes: '',
      profile_photo: ''
    });
    setAvatarFile(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingMember(member);
    setIsRepMode(isRepresentativeRole(member.position));
    setFormData({
      full_name: member.full_name || '',
      college_id: member.college_id || '',
      email: member.email || '',
      phone: member.phone || '',
      year: member.year || '2nd Year',
      branch: member.branch || '',
      section: member.section || (member.notes && member.notes.startsWith('Section:') ? member.notes.replace('Section:', '').trim() : ''),
      position: member.position || 'Club Member',
      department_id: member.department_id || '',
      joining_date: member.joining_date || '',
      status: member.status || 'Active',
      notes: member.notes || '',
      profile_photo: member.profile_photo || ''
    });
    setAvatarFile(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.college_id || !formData.email) {
      showToast('error', 'Validation Error', 'Full Name, College ID, and Email are required.');
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key] !== null ? formData[key] : '');
      });
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      if (editingMember) {
        await api.updateMember(editingMember.id, data);
        showToast('success', 'Member Updated', `${formData.full_name}'s profile has been updated.`);
      } else {
        await api.createMember(data);
        showToast('success', 'Member Added', `${formData.full_name} has been enrolled into STIC.`);
      }

      setIsFormOpen(false);
      fetchMembers();
    } catch (err) {
      showToast('error', 'Operation Failed', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      await api.deleteMember(deleteCandidate.id);
      showToast('success', 'Member Removed', `Member ${deleteCandidate.full_name} was removed from STIC.`);
      setDeleteCandidate(null);
      fetchMembers();
    } catch (err) {
      showToast('error', 'Deletion Error', err.message);
    }
  };

  const handleDemoteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      await api.updateMember(deleteCandidate.id, { position: 'Club Member' });
      showToast('success', 'Representative Demoted', `${deleteCandidate.full_name} was removed from Representatives and converted to a Club Member.`);
      setDeleteCandidate(null);
      fetchMembers();
    } catch (err) {
      showToast('error', 'Operation Failed', err.message);
    }
  };

  const openMemberDetail = async (memberId) => {
    try {
      const res = await api.getMember(memberId);
      setSelectedMemberDetail(res.data);
    } catch (err) {
      showToast('error', 'Failed to load details', err.message);
    }
  };

  const membersWithPhotosCount = members.filter(m => Boolean(m.profile_photo)).length;
  const isFormValid = Boolean(
    formData.full_name && formData.full_name.trim() &&
    formData.college_id && formData.college_id.trim() &&
    formData.email && formData.email.trim()
  );

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-title-wrap">
          <h1>
            <Users size={26} color="var(--primary-light)" />
            Club Members Management
          </h1>
          <p>
            Master registry of all active and past STIC collegiate innovators ({members.length} records)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '2px' }}>
            <button
              className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
              style={{ border: 'none', background: viewMode === 'grid' ? 'var(--bg-surface-elevated)' : 'transparent', color: viewMode === 'grid' ? 'var(--primary-light)' : 'var(--text-subtle)' }}
              onClick={() => setViewMode('grid')}
              title="Grid Cards View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`btn-icon ${viewMode === 'table' ? 'active' : ''}`}
              style={{ border: 'none', background: viewMode === 'table' ? 'var(--bg-surface-elevated)' : 'transparent', color: viewMode === 'table' ? 'var(--primary-light)' : 'var(--text-subtle)' }}
              onClick={() => setViewMode('table')}
              title="Data Table View"
            >
              <List size={16} />
            </button>
          </div>

          {canManageMembers && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                onClick={handleOpenAddRepresentativeModal}
                style={{ borderColor: 'var(--primary-light)', color: 'var(--primary-light)', fontWeight: 600 }}
              >
                <Award size={16} />
                + Add Representative
              </button>
              <button className="btn btn-primary" onClick={handleOpenAddModal}>
                <Plus size={16} />
                + Add Member
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="filter-search-box">
          <Search size={16} className="search-icon-pos" />
          <input
            type="text"
            placeholder="Search by name, ID, email, role, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Department Filter */}
        <select
          className="filter-select"
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {(departments || []).map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
          <option value="unassigned">Club Member</option>
        </select>

        {/* Year Filter */}
        <select
          className="filter-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value="">All Academic Years</option>
          <option value="1st Year">1st Year</option>
          <option value="2nd Year">2nd Year</option>
          <option value="3rd Year">3rd Year</option>
          <option value="4th Year">4th Year</option>
        </select>

        {/* Section Filter */}
        <select
          className="filter-select"
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
        >
          <option value="">All Sections</option>
          <option value="CSE-A">Section CSE-A</option>
          <option value="CSE-B">Section CSE-B</option>
          <option value="CSE-C">Section CSE-C</option>
          <option value="CSE-D">Section CSE-D</option>
          <option value="CSE-E">Section CSE-E</option>
          <option value="CSE-F">Section CSE-F</option>
        </select>

        {/* Status Filter */}
        <select
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        {/* Sorting Dropdown */}
        <select
          className="filter-select"
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [sb, so] = e.target.value.split(':');
            setSortBy(sb);
            setSortOrder(so);
          }}
        >
          <option value="full_name:ASC">Sort: Name (A-Z)</option>
          <option value="full_name:DESC">Sort: Name (Z-A)</option>
          <option value="department:ASC">Sort: Department</option>
          <option value="year:DESC">Sort: Year (Seniority)</option>
          <option value="joining_date:DESC">Sort: Joining Date</option>
        </select>
      </div>

      {/* Members Presentation */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px' }}>Loading members database...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="stic-card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Users size={40} style={{ margin: '0 auto 14px', color: 'var(--text-subtle)' }} />
          <h3>No Club Members Found</h3>
          <p style={{ marginTop: '6px', fontSize: '0.88rem' }}>
            No members match your current filters. Clear the search or add a new club member.
          </p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: '16px' }} onClick={handleOpenAddModal}>
            <Plus size={15} /> Add First Member
          </button>
        </div>
      ) : (() => {
        const sortedMembers = [...members].sort((a, b) => {
          const rankA = getRoleRank(a.position);
          const rankB = getRoleRank(b.position);
          if (rankA !== rankB) return rankA - rankB;
          return a.id - b.id;
        });

        const getMemberSection = (m) => {
          if (m.section) return m.section;
          if (m.notes && m.notes.startsWith('Section:')) return m.notes.replace('Section:', '').trim();
          if (m.notes && m.notes.includes('CSE-')) {
            const match = m.notes.match(/CSE-[A-F]/i);
            if (match) return match[0].toUpperCase();
          }
          if (m.branch && m.branch.includes('CSE-')) {
            const match = m.branch.match(/CSE-[A-F]/i);
            if (match) return match[0].toUpperCase();
          }
          const id = (m.college_id || '').toUpperCase().trim();
          if (id === '254G1A05AY' || (m.full_name && m.full_name.toLowerCase().includes('nihas'))) {
            return 'CSE-F';
          }
          return null;
        };

        const representatives = sortedMembers.filter(m => isRepresentativeRole(m.position));
        const clubMembersList = sortedMembers.filter(m => !isRepresentativeRole(m.position));

        const sectionTabs = ['CSE-A', 'CSE-B', 'CSE-C', 'CSE-D', 'CSE-E', 'CSE-F'];
        const sectionCounts = {};
        sectionTabs.forEach(s => {
          sectionCounts[s] = clubMembersList.filter(m => getMemberSection(m) === s).length;
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>

            {/* =========================================================
                SECTION 1: CLUB REPRESENTATIVES
                ========================================================= */}
            <div className="members-section-block">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: '2px solid var(--primary-light)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award size={22} color="var(--primary-light)" />
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                      Club Representatives
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                      Executive Council & Leadership Team ({representatives.length} Representatives)
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span className="badge badge-success" style={{ fontWeight: 700, padding: '5px 12px' }}>
                    {representatives.length} Representatives
                  </span>
                  {canManageMembers && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleOpenAddRepresentativeModal}
                      style={{ fontWeight: 700 }}
                    >
                      <Plus size={15} />
                      + Add Representative
                    </button>
                  )}
                </div>
              </div>

              {representatives.length === 0 ? (
                <div className="stic-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Award size={36} style={{ margin: '0 auto 12px', color: 'var(--primary-light)', opacity: 0.8 }} />
                  <h4 style={{ color: 'var(--text-main)', marginBottom: '6px' }}>No Club Representatives Yet</h4>
                  <p style={{ fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 14px' }}>
                    Assign executive leadership roles (President, Vice President, Secretary, Technical Lead, etc.) to showcase club representatives.
                  </p>
                  {canManageMembers && (
                    <button className="btn btn-primary btn-sm" onClick={handleOpenAddRepresentativeModal}>
                      <Plus size={14} /> + Add First Representative
                    </button>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="members-grid">
                  {representatives.map((m) => {
                    const roleInfo = getRoleDetails(m.position);
                    return (
                      <div key={m.id} className="member-card" style={{ borderColor: 'rgba(16, 185, 129, 0.35)', background: 'var(--bg-surface)' }}>
                        <div className="member-avatar" style={{ width: '140px', height: '140px', minWidth: '140px', minHeight: '140px', aspectRatio: '1 / 1', borderRadius: '50%', border: '4px solid var(--primary-light)', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)', overflow: 'hidden', margin: '0 auto 16px', flexShrink: 0 }}>
                          {m.profile_photo ? (
                            <img src={m.profile_photo} alt={m.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          ) : (
                            <span style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                              {m.full_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="member-name" title={m.full_name} style={{ marginBottom: '6px' }}>{m.full_name}</div>
                        
                        {/* Title Pill (Small Size) */}
                        <div
                          className="member-position"
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            color: '#34d399',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            padding: '3px 10px',
                            borderRadius: '16px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            maxWidth: '92%',
                            margin: '0 auto 4px',
                            lineHeight: 1.3
                          }}
                        >
                          {m.position}
                        </div>

                        {/* Supports Badge if Co-President or Co-Vice President */}
                        {roleInfo.supportsTag && (
                          <div style={{ margin: '2px 0 6px' }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: '#38bdf8',
                                background: 'rgba(56, 189, 248, 0.12)',
                                border: '1px solid rgba(56, 189, 248, 0.35)',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                display: 'inline-block'
                              }}
                            >
                              🤝 {roleInfo.supportsTag}
                            </span>
                          </div>
                        )}

                        <div className="member-college-id" style={{ fontSize: '0.78rem' }}>{m.college_id}</div>

                        {/* Official Core Responsibilities Box */}
                        <div
                          style={{
                            width: '100%',
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            margin: '12px 0 10px',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle size={12} color="var(--primary)" /> Role Responsibilities
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45, display: 'flex', flexDirection: 'column', gap: '3px', fontWeight: 500 }}>
                            {roleInfo.duties.map((duty, idx) => (
                              <li key={idx}>{duty}</li>
                            ))}
                          </ul>
                        </div>

                      <div style={{ margin: '12px 0 14px', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                        <span className="badge badge-neutral">
                          <Building2 size={12} /> {m.department_name || 'No Dept'}
                        </span>
                        <span className="badge badge-neutral">
                          <BookOpen size={12} /> {m.year}
                        </span>
                        <span className={`badge ${m.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                          {m.status}
                        </span>
                      </div>

                      <div style={{ width: '100%', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          <Mail size={13} color="var(--text-subtle)" />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</span>
                        </div>
                        {m.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={13} color="var(--text-subtle)" />
                            <span>{m.phone}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '14px', width: '100%' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => openMemberDetail(m.id)}
                          title="View Profile"
                        >
                          <Eye size={14} /> Profile
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(m)}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteCandidate({ ...m, isRepresentative: true })}
                          title="Delete / Demote Representative"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              ) : (
                <div className="stic-card" style={{ padding: 0 }}>
                  <div className="table-responsive">
                    <table className="stic-table">
                      <thead>
                        <tr>
                          <th>Representative</th>
                          <th>College ID</th>
                          <th>Department</th>
                          <th>Year & Branch</th>
                          <th>Designation / Role</th>
                          <th>Status</th>
                          <th>Contact</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {representatives.map((m) => (
                          <tr key={m.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '2px solid var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.86rem', overflow: 'hidden' }}>
                                  {m.profile_photo ? <img src={m.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.full_name.charAt(0)}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{m.full_name}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{m.college_id}</td>
                            <td><span className="badge badge-neutral">{m.department_name || 'Unassigned'}</span></td>
                            <td style={{ fontSize: '0.82rem' }}>{m.year} · {m.branch}</td>
                            <td>
                              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.28)', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                                {m.position}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${m.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                                {m.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              <div>{m.email}</div>
                              <div>{m.phone}</div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="btn-icon" onClick={() => openMemberDetail(m.id)} title="View Profile">
                                  <Eye size={14} />
                                </button>
                                <button className="btn-icon" onClick={() => handleOpenEditModal(m)} title="Edit">
                                  <Edit2 size={14} />
                                </button>
                                <button className="btn-icon" onClick={() => setDeleteCandidate({ ...m, isRepresentative: true })} title="Delete / Demote Representative" style={{ color: '#fb7185' }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* =========================================================
                SECTION 2: CLUB MEMBERS (ALL REMAINING MEMBERS)
                ========================================================= */}
            <div className="members-section-block">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '2px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={22} color="var(--primary-light)" />
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                      Club Members
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                      General Club Registry ({clubMembersList.length} Members)
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedSection && (
                    <span className="badge badge-info" style={{ fontWeight: 700, padding: '4px 10px' }}>
                      Filtering: {selectedSection}
                    </span>
                  )}
                  <span className="badge badge-neutral" style={{ fontWeight: 600, padding: '4px 12px' }}>
                    {clubMembersList.length} Members
                  </span>
                </div>
              </div>

              {/* Classroom Section Filter Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '20px',
                  padding: '10px 14px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '4px' }}>
                  Classroom Section:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSection('')}
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    fontWeight: selectedSection === '' ? 700 : 500,
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: selectedSection === '' ? 'var(--primary-light)' : 'var(--border-subtle)',
                    background: selectedSection === '' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: selectedSection === '' ? 'var(--primary-light)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  All Sections
                </button>
                {sectionTabs.map(sec => {
                  const isSelected = selectedSection === sec;
                  const count = sectionCounts[sec] || 0;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSelectedSection(isSelected ? '' : sec)}
                      style={{
                        padding: '4px 12px',
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? 700 : 500,
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: isSelected ? '#38bdf8' : 'var(--border-subtle)',
                        background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                        color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {sec} {count > 0 ? `(${count})` : ''}
                    </button>
                  );
                })}
              </div>

              {clubMembersList.length === 0 ? (
                <div className="stic-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>
                    {selectedSection ? (
                      <>
                        No club members found for section <strong>{selectedSection}</strong>.{' '}
                        <button
                          type="button"
                          onClick={() => setSelectedSection('')}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-light)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                        >
                          Show all sections
                        </button>
                      </>
                    ) : (
                      <>All enrolled members are currently assigned to the Club Representatives section. Click <strong>"+ Add Member"</strong> to enroll additional club members.</>
                    )}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="members-grid">
                  {clubMembersList.map((m) => {
                    const sec = getMemberSection(m);
                    return (
                      <div key={m.id} className="member-card">
                        <div className="member-name" style={{ marginTop: '8px', marginBottom: '4px' }} title={m.full_name}>{m.full_name}</div>
                        <div className="member-position" style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-light)', margin: '0 0 6px' }}>{m.position}</div>
                        <div className="member-college-id">{m.college_id}</div>

                        <div style={{ margin: '12px 0 16px', display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                          {sec && (
                            <span className="badge badge-info" style={{ fontWeight: 700, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                              Section: {sec}
                            </span>
                          )}
                          {m.department_name ? (
                            <span className="badge badge-neutral">
                              <Building2 size={12} /> {m.department_name}
                            </span>
                          ) : null}
                          <span className="badge badge-neutral">
                            <BookOpen size={12} /> {m.year}
                          </span>
                          {m.branch && !sec ? (
                            <span className="badge badge-neutral" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.branch}
                            </span>
                          ) : null}
                          <span className={`badge ${m.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                            {m.status}
                          </span>
                        </div>

                        <div style={{ width: '100%', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                            <Mail size={13} color="var(--text-subtle)" />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</span>
                          </div>
                          {m.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={13} color="var(--text-subtle)" />
                              <span>{m.phone}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', width: '100%' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1 }}
                            onClick={() => openMemberDetail(m.id)}
                            title="View full profile"
                          >
                            <Eye size={14} /> Profile
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditModal(m)}
                            title="Edit member"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteCandidate(m)}
                            title="Delete member"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="stic-card" style={{ padding: 0 }}>
                  <div className="table-responsive">
                    <table className="stic-table">
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>College ID / Roll No</th>
                          <th>Section</th>
                          <th>Department</th>
                          <th>Year & Branch</th>
                          <th>Position</th>
                          <th>Status</th>
                          <th>Contact</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clubMembersList.map((m) => {
                          const sec = getMemberSection(m);
                          return (
                            <tr key={m.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.full_name}</div>
                              </td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{m.college_id}</td>
                              <td>
                                {sec ? (
                                  <span className="badge badge-info" style={{ fontWeight: 700, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                                    {sec}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>—</span>
                                )}
                              </td>
                              <td><span className="badge badge-neutral">{m.department_name || 'Unassigned'}</span></td>
                              <td style={{ fontSize: '0.82rem' }}>{m.year} · {m.branch}</td>
                              <td style={{ fontWeight: 600, color: 'var(--primary-light)' }}>{m.position}</td>
                              <td>
                                <span className={`badge ${m.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                                  {m.status}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                <div>{m.email}</div>
                                <div>{m.phone}</div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="btn-icon" onClick={() => openMemberDetail(m.id)} title="View Profile">
                                    <Eye size={14} />
                                  </button>
                                  <button className="btn-icon" onClick={() => handleOpenEditModal(m)} title="Edit">
                                    <Edit2 size={14} />
                                  </button>
                                  <button className="btn-icon" onClick={() => setDeleteCandidate(m)} title="Delete" style={{ color: '#fb7185' }}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        );
      })()}

      {/* Add / Edit Member Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>
                <Users size={20} color="var(--primary-light)" />
                {editingMember
                  ? `Edit Member: ${editingMember.full_name}`
                  : isRepMode
                  ? 'Add New Club Representative'
                  : 'Enrol New STIC Club Member'}
              </h3>
              <button className="btn-icon" onClick={() => setIsFormOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">College ID / Roll Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. STIC-2026-104 or 23CS042"
                      value={formData.college_id}
                      onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      required
                      placeholder="e.g. aarav@college.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <select
                      className="form-select"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Branch / Department of Study</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Computer Science, Mechanical, Civil..."
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Academic Section</label>
                    <select
                      className="form-select"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    >
                      <option value="">No Section Assigned</option>
                      <option value="CSE-A">Section CSE-A</option>
                      <option value="CSE-B">Section CSE-B</option>
                      <option value="CSE-C">Section CSE-C</option>
                      <option value="CSE-D">Section CSE-D</option>
                      <option value="CSE-E">Section CSE-E</option>
                      <option value="CSE-F">Section CSE-F</option>
                    </select>
                  </div>

                  <div className="form-group form-full">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Award size={15} color="var(--primary-light)" />
                      <span>Role Classification</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          background: isRepMode ? 'rgba(16, 185, 129, 0.16)' : 'var(--bg-surface-elevated)',
                          border: isRepMode ? '2px solid var(--primary-light)' : '1px solid var(--border-subtle)',
                          color: isRepMode ? 'var(--primary-light)' : 'var(--text-muted)',
                          fontWeight: isRepMode ? 700 : 500,
                          padding: '10px 14px',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setIsRepMode(true);
                          if (!isRepresentativeRole(formData.position)) {
                            setFormData({ ...formData, position: 'Vice President' });
                          }
                        }}
                      >
                        🎖️ Club Representative (Leadership)
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          background: !isRepMode ? 'rgba(56, 189, 248, 0.16)' : 'var(--bg-surface-elevated)',
                          border: !isRepMode ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                          color: !isRepMode ? '#38bdf8' : 'var(--text-muted)',
                          fontWeight: !isRepMode ? 700 : 500,
                          padding: '10px 14px',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setIsRepMode(false);
                          setFormData({ ...formData, position: 'Club Member' });
                        }}
                      >
                        👤 Regular Club Member
                      </button>
                    </div>
                  </div>

                  {isRepMode ? (
                    <div className="form-group">
                      <label className="form-label">Representative Executive Role *</label>
                      <select
                        className="form-select"
                        value={REPRESENTATIVE_POSITIONS.includes(formData.position) ? formData.position : 'Custom'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'Custom') {
                            setFormData({ ...formData, position: 'Lead Coordinator' });
                          } else {
                            setFormData({ ...formData, position: val });
                          }
                        }}
                      >
                        {REPRESENTATIVE_POSITIONS.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                        <option value="Custom">Custom Executive Position...</option>
                      </select>
                      {!REPRESENTATIVE_POSITIONS.includes(formData.position) && (
                        <input
                          type="text"
                          className="form-input"
                          style={{ marginTop: '8px' }}
                          placeholder="e.g. Innovation Lead, Outreach Head"
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Club Position / Designation</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Club Member, Volunteer, Contributor"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Assigned Department</label>
                    <select
                      className="form-select"
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    >
                      <option value="">Club Member</option>
                      {(departments || []).map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Joining Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.joining_date}
                      onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Photo Option: Open for everyone to set their DP */}
                  <div className="form-group form-full">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Camera size={15} color="var(--primary-light)" />
                        <span>Member Display Picture (DP)</span>
                      </label>
                      <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                        Open for All Members
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'var(--bg-surface-elevated)',
                          border: '2px solid var(--primary-light)',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {avatarFile ? (
                          <img
                            src={URL.createObjectURL(avatarFile)}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : formData.profile_photo ? (
                          <img
                            src={formData.profile_photo}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Camera size={20} color="var(--text-subtle)" />
                        )}
                      </div>
                      <div style={{ flex: 1, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-input"
                          style={{ flex: 1, minWidth: '180px' }}
                          onChange={(e) => setAvatarFile(e.target.files[0] || null)}
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1, minWidth: '180px' }}
                          placeholder="Or paste direct image URL"
                          value={formData.profile_photo}
                          onChange={(e) => setFormData({ ...formData, profile_photo: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group form-full">
                    <label className="form-label">Additional Notes</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Contributions, domain skills, project involvement..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Footer: Always visible at bottom, enabled when required fields are completed */}
              <div
                className="modal-footer"
                style={{
                  position: 'sticky',
                  bottom: 0,
                  background: 'var(--bg-surface-elevated, #131f33)',
                  borderTop: '1px solid var(--border-subtle)',
                  zIndex: 30,
                  padding: '16px 24px',
                  display: 'flex',
                  justify: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  flexShrink: 0
                }}
              >
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!isFormValid}
                  style={{
                    opacity: isFormValid ? 1 : 0.6,
                    cursor: isFormValid ? 'pointer' : 'not-allowed',
                    minWidth: '140px',
                    justifyContent: 'center'
                  }}
                >
                  {editingMember
                    ? 'Save Changes'
                    : isRepMode
                    ? 'Add Representative'
                    : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Details & Coordinated Programs Drawer */}
      {selectedMemberDetail && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>Member Profile Details</h3>
              <button className="btn-icon" onClick={() => setSelectedMemberDetail(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '20px' }}>
                <div style={{ width: '90px', height: '90px', minWidth: '90px', minHeight: '90px', aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '3px solid var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '2rem', color: 'var(--primary-light)', overflow: 'hidden', flexShrink: 0, boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)' }}>
                  {selectedMemberDetail.profile_photo ? (
                    <img src={selectedMemberDetail.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : selectedMemberDetail.full_name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>{selectedMemberDetail.full_name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#34d399', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                      {selectedMemberDetail.position}
                    </span>
                    {getRoleDetails(selectedMemberDetail.position).supportsTag && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '2px 8px', borderRadius: '10px' }}>
                        🤝 {getRoleDetails(selectedMemberDetail.position).supportsTag}
                      </span>
                    )}
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      · {selectedMemberDetail.department_name || 'No Department'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {selectedMemberDetail.college_id}
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.84rem', marginBottom: '18px' }}>
                <div><strong style={{ color: 'var(--text-subtle)' }}>Email:</strong> {selectedMemberDetail.email}</div>
                <div><strong style={{ color: 'var(--text-subtle)' }}>Phone:</strong> {selectedMemberDetail.phone || 'N/A'}</div>
                <div><strong style={{ color: 'var(--text-subtle)' }}>Academic:</strong> {selectedMemberDetail.year} ({selectedMemberDetail.branch})</div>
                <div><strong style={{ color: 'var(--text-subtle)' }}>Section:</strong> {selectedMemberDetail.section || (selectedMemberDetail.notes && selectedMemberDetail.notes.startsWith('Section:') ? selectedMemberDetail.notes.replace('Section:', '').trim() : 'N/A')}</div>
                <div><strong style={{ color: 'var(--text-subtle)' }}>Status:</strong> {selectedMemberDetail.status}</div>
                <div><strong style={{ color: 'var(--text-subtle)' }}>Joined:</strong> {selectedMemberDetail.joining_date}</div>
              </div>

              {/* Official Role Responsibilities */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-light)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={15} color="#34d399" /> Official Role Responsibilities
                </div>
                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {getRoleDetails(selectedMemberDetail.position).duties.map((duty, idx) => (
                      <li key={idx}>{duty}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {selectedMemberDetail.notes && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>Notes</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    {selectedMemberDetail.notes}
                  </p>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color="var(--primary-light)" />
                  Coordinated Programs ({selectedMemberDetail.coordinated_programs?.length || 0})
                </div>

                {selectedMemberDetail.coordinated_programs && selectedMemberDetail.coordinated_programs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedMemberDetail.coordinated_programs.map(cp => (
                      <div key={cp.id} style={{ padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{cp.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>{cp.program_code} · {cp.program_date}</div>
                        </div>
                        <span className="badge badge-info">{cp.role_title || 'Coordinator'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                    This member has not been assigned as coordinator to any programs yet.
                  </p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedMemberDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Demote Confirmation Modal */}
      {deleteCandidate && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ color: deleteCandidate.isRepresentative ? '#38bdf8' : '#fb7185', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {deleteCandidate.isRepresentative ? (
                  <>
                    <Award size={18} color="var(--primary-light)" />
                    Manage Representative: {deleteCandidate.full_name}
                  </>
                ) : (
                  <>
                    <Trash2 size={18} color="#fb7185" />
                    Delete Club Member
                  </>
                )}
              </h3>
              <button className="btn-icon" onClick={() => setDeleteCandidate(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {deleteCandidate.isRepresentative ? (
                <div>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '14px' }}>
                    What would you like to do with <strong>{deleteCandidate.full_name}</strong> (<strong>{deleteCandidate.position}</strong>)?
                  </p>
                  <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <UserMinus size={16} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: 'var(--text-main)' }}>Demote to Member:</strong>
                        <div style={{ color: 'var(--text-muted)' }}>Removes them from the Club Representatives list while safely preserving their membership and account in STIC.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Trash2 size={16} color="#fb7185" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#fb7185' }}>Delete Completely:</strong>
                        <div style={{ color: 'var(--text-muted)' }}>Permanently deletes this person and their records from the STIC club database.</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Are you sure you want to remove <strong>{deleteCandidate.full_name}</strong> ({deleteCandidate.college_id}) from the STIC database?
                  Their assignments in departments and coordinators will be safely updated.
                </p>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: deleteCandidate.isRepresentative ? 'space-between' : 'flex-end', flexWrap: 'wrap', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteCandidate(null)}>Cancel</button>
              {deleteCandidate.isRepresentative ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleDemoteConfirm}
                    style={{ borderColor: 'var(--primary-light)', color: 'var(--primary-light)', fontWeight: 600 }}
                  >
                    <UserMinus size={15} /> Demote to Member
                  </button>
                  <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                    <Trash2 size={15} /> Delete Permanently
                  </button>
                </div>
              ) : (
                <button className="btn btn-danger" onClick={handleDeleteConfirm}>Delete Member</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
