import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
  IndianRupee,
  Calendar,
  Sparkles,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { api } from '../api';

export default function ProgramsView({
  showToast,
  onSelectProgram,
  openAddTrigger,
  onCloseAddTrigger,
  allMembers
}) {
  const [programs, setPrograms] = useState([]);
  const [totalConducted, setTotalConducted] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    program_code: '',
    program_date: new Date().toISOString().split('T')[0],
    start_time: '10:00 AM',
    end_time: '04:00 PM',
    venue: 'Campus Innovation Hall',
    program_type: 'Workshop',
    description: '',
    participants_count: 50,
    status: 'Planned',
    poster_url: '',
    coordinator_ids: []
  });
  const [posterFile, setPosterFile] = useState(null);

  // Coordinator Search & Tag Selection State
  const [coordSearchQuery, setCoordSearchQuery] = useState('');
  const [showCoordDropdown, setShowCoordDropdown] = useState(false);

  const matchingMembersForCoord = (allMembers || []).filter(m => {
    if ((formData?.coordinator_ids || []).some(id => Number(id) === Number(m.id))) {
      return false;
    }
    if (!coordSearchQuery.trim()) return true;
    const q = coordSearchQuery.toLowerCase().trim();
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.college_id?.toLowerCase().includes(q) ||
      m.department_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

  const handleSelectCoordinatorMember = (memberId) => {
    if (!formData.coordinator_ids.some(id => Number(id) === Number(memberId))) {
      setFormData(prev => ({
        ...prev,
        coordinator_ids: [...prev.coordinator_ids, Number(memberId)]
      }));
    }
    setCoordSearchQuery('');
    setShowCoordDropdown(false);
  };

  const handleRemoveCoordinatorTag = (memberId) => {
    setFormData(prev => ({
      ...prev,
      coordinator_ids: prev.coordinator_ids.filter(id => Number(id) !== Number(memberId))
    }));
  };

  const handleCoordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingMembersForCoord.length > 0) {
        handleSelectCoordinatorMember(matchingMembersForCoord[0].id);
      }
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [search, statusFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (openAddTrigger) {
      handleOpenAddModal();
      if (onCloseAddTrigger) onCloseAddTrigger();
    }
  }, [openAddTrigger]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.program_type = typeFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await api.getPrograms(params);
      setPrograms(res.data || []);
      setTotalConducted(res.total_conducted || 0);
    } catch (err) {
      showToast('error', 'Error fetching programs', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProgram(null);
    setFormData({
      name: '',
      program_code: '',
      program_date: new Date().toISOString().split('T')[0],
      start_time: '10:00 AM',
      end_time: '04:00 PM',
      venue: 'Campus Innovation Hall',
      program_type: 'Workshop',
      description: '',
      participants_count: 50,
      status: 'Planned',
      poster_url: '',
      poster_removed: false,
      coordinator_ids: []
    });
    setPosterFile(null);
    setCoordSearchQuery('');
    setShowCoordDropdown(false);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (prog, e) => {
    if (e) e.stopPropagation();
    setEditingProgram(prog);
    setFormData({
      name: prog.name,
      program_code: prog.program_code,
      program_date: prog.program_date,
      start_time: prog.start_time || '',
      end_time: prog.end_time || '',
      venue: prog.venue || '',
      program_type: prog.program_type || 'Workshop',
      description: prog.description || '',
      participants_count: prog.participants_count || 0,
      status: prog.status || 'Planned',
      poster_url: prog.poster_url || '',
      poster_removed: false,
      coordinator_ids: (prog.coordinators || []).map(c => c.member_id)
    });
    setPosterFile(null);
    setCoordSearchQuery('');
    setShowCoordDropdown(false);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.program_date) {
      showToast('error', 'Validation Error', 'Program name and date are required.');
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'coordinator_ids') {
          data.append('coordinator_ids', JSON.stringify(formData.coordinator_ids));
        } else {
          data.append(key, formData[key] !== null ? formData[key] : '');
        }
      });
      if (posterFile) {
        data.append('poster', posterFile);
      }

      if (editingProgram) {
        await api.updateProgram(editingProgram.id, data);
        showToast('success', 'Program Updated', `${formData.name} updated successfully.`);
      } else {
        await api.createProgram(data);
        showToast('success', 'Program Scheduled', `${formData.name} has been added to STIC programs.`);
      }

      setIsFormOpen(false);
      fetchPrograms();
    } catch (err) {
      showToast('error', 'Operation Failed', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      await api.deleteProgram(deleteCandidate.id);
      showToast('success', 'Program Deleted', `"${deleteCandidate.name}" and associated records removed.`);
      setDeleteCandidate(null);
      fetchPrograms();
    } catch (err) {
      showToast('error', 'Deletion Error', err.message);
    }
  };

  const formatINR = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'badge-success';
      case 'Upcoming': return 'badge-info';
      case 'Ongoing': return 'badge-warning';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-title-wrap">
          <h1>
            <CalendarDays size={26} color="var(--primary-light)" />
            Programs & Events Management
          </h1>
          <p>
            Total Programs Conducted: <strong style={{ color: '#34d399' }}>{totalConducted}</strong> · Total Registered Programs: <strong>{programs.length}</strong>
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} />
          + Add Program
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="filter-search-box">
          <Search size={16} className="search-icon-pos" />
          <input
            type="text"
            placeholder="Search programs by name, code, venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Planned">Planned</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {/* Type Filter */}
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Program Types</option>
          <option value="Workshop">Workshop</option>
          <option value="Hackathon">Hackathon</option>
          <option value="Seminar">Seminar</option>
          <option value="Clean-Up Drive">Clean-Up Drive</option>
          <option value="Webinar">Webinar</option>
          <option value="Innovation Fair">Innovation Fair</option>
          <option value="Industrial Visit">Industrial Visit</option>
          <option value="Guest Lecture">Guest Lecture</option>
        </select>

        {/* Date Filter */}
        <input
          type="date"
          className="filter-select"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          title="From Date"
        />
        <input
          type="date"
          className="filter-select"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          title="To Date"
        />
      </div>

      {/* Programs List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px' }}>Loading programs...</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="stic-card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <CalendarDays size={40} style={{ margin: '0 auto 14px', color: 'var(--text-subtle)' }} />
          <h3>No Programs Found</h3>
          <p style={{ marginTop: '6px', fontSize: '0.88rem' }}>
            No events match your current filter settings. Click "+ Add Program" to schedule an event.
          </p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: '16px' }} onClick={handleOpenAddModal}>
            <Plus size={15} /> Add First Program
          </button>
        </div>
      ) : (
        <div className="programs-grid">
          {programs.map((prog) => (
            <div
              key={prog.id}
              className="program-card"
              onClick={() => onSelectProgram(prog.id)}
            >
              <div className="program-poster-box">
                {prog.poster_url ? (
                  <img src={prog.poster_url} alt={prog.name} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #132238 0%, #0d1624 100%)', color: 'var(--text-subtle)' }}>
                    <CalendarDays size={48} opacity={0.3} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                  <span className={`badge ${getStatusBadge(prog.status)}`}>
                    {prog.status}
                  </span>
                </div>

              </div>

              <div className="program-card-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--primary-light)', fontWeight: 700, fontFamily: 'monospace' }}>
                    {prog.program_code}
                  </span>
                  <span className="badge badge-neutral">{prog.program_type}</span>
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', lineHeight: 1.35 }} title={prog.name}>
                  {prog.name}
                </h3>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {prog.description || 'No description provided.'}
                </p>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', color: 'var(--text-subtle)', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} color="var(--primary-light)" />
                    <span>{prog.program_date} {prog.start_time ? `(${prog.start_time})` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} color="var(--accent-cyan)" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prog.venue}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={13} />
                      <span>{prog.participants_count} Attendees</span>
                    </div>
                    <div style={{ fontWeight: 700, color: prog.total_balance >= 0 ? '#34d399' : '#fb7185' }}>
                      Bal: {formatINR(prog.total_balance)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => onSelectProgram(prog.id)}
                  >
                    Open Details <ChevronRight size={13} />
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => handleOpenEditModal(prog, e)}
                    title="Edit Program"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteCandidate(prog); }}
                    title="Delete Program"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Program Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <h3>
                <CalendarDays size={20} color="var(--primary-light)" />
                {editingProgram ? `Edit Program: ${editingProgram.name}` : 'Schedule New STIC Program / Event'}
              </h3>
              <button className="btn-icon" onClick={() => setIsFormOpen(false)}><X size={16} /></button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label className="form-label">Program Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. STIC Annual Robotics & Circular Waste Hackathon"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Program Code (Auto-generated if empty)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. STIC-2026-003"
                      value={formData.program_code}
                      onChange={(e) => setFormData({ ...formData, program_code: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Program Type</label>
                    <select
                      className="form-select"
                      value={formData.program_type}
                      onChange={(e) => setFormData({ ...formData, program_type: e.target.value })}
                    >
                      <option value="Workshop">Workshop</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Clean-Up Drive">Clean-Up Drive</option>
                      <option value="Webinar">Webinar</option>
                      <option value="Innovation Fair">Innovation Fair</option>
                      <option value="Industrial Visit">Industrial Visit</option>
                      <option value="Guest Lecture">Guest Lecture</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Event Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={formData.program_date}
                      onChange={(e) => setFormData({ ...formData, program_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Planned">Planned</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 10:00 AM"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 04:30 PM"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Campus Venue</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Auditorium Hall B & Innovation Lab"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Expected / Actual Participants Count</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.participants_count}
                      onChange={(e) => setFormData({ ...formData, participants_count: e.target.value })}
                    />
                  </div>

                  <div className="form-group form-full" style={{ position: 'relative' }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Assign Coordinators from Club Members</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                        {formData.coordinator_ids.length} Finalized
                      </span>
                    </label>

                    {/* Selected Coordinator Tags / Chips */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginBottom: formData.coordinator_ids.length > 0 ? '8px' : '0'
                    }}>
                      {formData.coordinator_ids.map((id) => {
                        const m = (allMembers || []).find(mem => Number(mem.id) === Number(id));
                        if (!m) return null;
                        return (
                          <span
                            key={id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 10px',
                              borderRadius: '20px',
                              background: 'var(--primary-soft)',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              color: 'var(--text-main)',
                              fontSize: '0.82rem',
                              fontWeight: 600
                            }}
                          >
                            <span style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'var(--primary)',
                              color: '#fff',
                              fontSize: '0.68rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700
                            }}>
                              {m.full_name ? m.full_name.charAt(0).toUpperCase() : 'M'}
                            </span>
                            {m.full_name} <span style={{ color: 'var(--text-subtle)', fontSize: '0.74rem' }}>({m.college_id})</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCoordinatorTag(id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#fb7185',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                marginLeft: '4px'
                              }}
                              title="Remove Coordinator"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        );
                      })}
                    </div>

                    {/* Searchable Text Input Box */}
                    <div style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: '12px', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Type member name, college ID, or department to assign & finalize..."
                          value={coordSearchQuery}
                          onChange={(e) => {
                            setCoordSearchQuery(e.target.value);
                            setShowCoordDropdown(true);
                          }}
                          onFocus={() => setShowCoordDropdown(true)}
                          onKeyDown={handleCoordKeyDown}
                          style={{ paddingLeft: '36px', fontSize: '0.84rem' }}
                        />
                      </div>

                      {/* Floating Suggestions Dropdown */}
                      {showCoordDropdown && coordSearchQuery.trim() !== '' && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 200,
                            marginTop: '4px',
                            maxHeight: '220px',
                            overflowY: 'auto',
                            background: 'var(--bg-surface-elevated, #1a2a44)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)'
                          }}
                        >
                          {matchingMembersForCoord.length === 0 ? (
                            <div style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
                              No matching club members found for "{coordSearchQuery}".
                            </div>
                          ) : (
                            matchingMembersForCoord.slice(0, 8).map((m) => (
                              <div
                                key={m.id}
                                onClick={() => handleSelectCoordinatorMember(m.id)}
                                style={{
                                  padding: '10px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                                  transition: 'background 0.15s ease'
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: 'var(--primary-soft)',
                                    color: 'var(--primary-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.78rem'
                                  }}>
                                    {m.full_name ? m.full_name.charAt(0).toUpperCase() : 'M'}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                      {m.full_name}
                                    </div>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                                      {m.college_id} · {m.department_name || 'No Dept'}
                                    </div>
                                  </div>
                                </div>
                                <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>
                                  + Select
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px', display: 'block' }}>
                      Type a person's name or college ID in the search box and press Enter or click to finalize them as a coordinator.
                    </span>
                  </div>

                  <div className="form-group form-full">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Program Poster (Banner / Flier Image)</span>
                      {(posterFile || formData.poster_url) && (
                        <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 600 }}>
                          ✓ Poster Active
                        </span>
                      )}
                    </label>

                    {/* Poster Preview Box if file or URL exists */}
                    {(posterFile || formData.poster_url) ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        marginBottom: '10px'
                      }}>
                        <div style={{
                          width: '74px',
                          height: '74px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#0d1624',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          <img
                            src={posterFile ? URL.createObjectURL(posterFile) : formData.poster_url}
                            alt="Program Poster Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-subtle)' }}>
                            <ImageIcon size={24} opacity={0.5} />
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                              {posterFile ? 'New Image Selected' : 'Saved Poster Active'}
                            </span>
                            {posterFile && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                                ({Math.round(posterFile.size / 1024)} KB)
                              </span>
                            )}
                          </div>
                          <p style={{
                            margin: '4px 0 0 0',
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {posterFile ? posterFile.name : (formData.poster_url.startsWith('data:') ? 'Stored Poster Image' : formData.poster_url)}
                          </p>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                            {posterFile ? 'Click "Save Program" to apply this image.' : 'This poster is currently active for this event.'}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <label
                            className="btn btn-secondary btn-sm"
                            style={{ cursor: 'pointer', margin: 0, fontSize: '0.78rem' }}
                          >
                            Upload New
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setPosterFile(e.target.files[0]);
                                  setFormData(prev => ({ ...prev, poster_removed: false }));
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ color: '#fb7185', borderColor: 'rgba(251, 113, 133, 0.3)', fontSize: '0.78rem' }}
                            onClick={() => {
                              setPosterFile(null);
                              setFormData(prev => ({ ...prev, poster_url: '', poster_removed: true }));
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Upload / URL Input Controls */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Upload size={15} /> Choose Poster File
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setPosterFile(e.target.files[0]);
                              setFormData(prev => ({ ...prev, poster_removed: false }));
                            }
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1, minWidth: '220px' }}
                        placeholder="Or enter direct poster image URL (https://...)"
                        value={formData.poster_url && !formData.poster_url.startsWith('data:') ? formData.poster_url : ''}
                        onChange={(e) => {
                          setPosterFile(null);
                          setFormData({ ...formData, poster_url: e.target.value, poster_removed: !e.target.value });
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group form-full">
                    <label className="form-label">Description & Objectives</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Detailed agenda, sustainability goals, prerequisites..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProgram ? 'Save Program' : 'Schedule Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#fb7185' }}>Delete Program</h3>
              <button className="btn-icon" onClick={() => setDeleteCandidate(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{deleteCandidate.name}</strong> ({deleteCandidate.program_code})?
                This will delete its associated photos, videos, and documentation.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteCandidate(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
