import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  FileText,
  IndianRupee,
  Share2,
  Cpu,
  CalendarCheck,
  Lightbulb,
  X,
  Plus,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';

export default function DepartmentsView({ showToast, onRefreshStats }) {
  const [departments, setDepartments] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedDeptDetail, setSelectedDeptDetail] = useState(null);
  const [isEditDeptOpen, setIsEditDeptOpen] = useState(false);
  const [isAssignMemberOpen, setIsAssignMemberOpen] = useState(false);
  const [isChangeLeadOpen, setIsChangeLeadOpen] = useState(false);
  const [isChangeCoLead1Open, setIsChangeCoLead1Open] = useState(false);
  const [isChangeCoLead2Open, setIsChangeCoLead2Open] = useState(false);
  const [isCreateDeptOpen, setIsCreateDeptOpen] = useState(false);
  const [activeDept, setActiveDept] = useState(null);

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', description: '', lead_member_id: '', co_lead_1_member_id: '', co_lead_2_member_id: '', icon: '' });
  const [newDeptForm, setNewDeptForm] = useState({ name: '', description: '', lead_member_id: '', co_lead_1_member_id: '', co_lead_2_member_id: '', icon: 'Lightbulb' });
  const [assignMemberId, setAssignMemberId] = useState('');
  const [newLeadId, setNewLeadId] = useState('');
  const [newCoLead1Id, setNewCoLead1Id] = useState('');
  const [newCoLead2Id, setNewCoLead2Id] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptRes, memRes] = await Promise.all([
        api.getDepartments(),
        api.getMembers()
      ]);
      setDepartments(deptRes.data || []);
      setAllMembers(memRes.data || []);
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      showToast('error', 'Failed to load department data', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDeptIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('project') || n.includes('innovation')) return Lightbulb;
    if (n.includes('content') || n.includes('documentation')) return FileText;
    if (n.includes('finance') || n.includes('sponsorship')) return IndianRupee;
    if (n.includes('social') || n.includes('publicity')) return Share2;
    if (n.includes('technical') || n.includes('infrastructure')) return Cpu;
    if (n.includes('event') || n.includes('coordinator')) return CalendarCheck;
    return Building2;
  };

  const openDepartmentDetails = async (dept) => {
    try {
      const res = await api.getDepartment(dept.id);
      setSelectedDeptDetail(res.data);
    } catch (err) {
      showToast('error', 'Failed to load department details', err.message);
    }
  };

  const openEditDept = (dept) => {
    setActiveDept(dept);
    setDeptForm({
      name: dept.name,
      description: dept.description || '',
      lead_member_id: dept.lead_member_id || '',
      co_lead_1_member_id: dept.co_lead_1_member_id || dept.co_lead_member_id || '',
      co_lead_2_member_id: dept.co_lead_2_member_id || '',
      icon: dept.icon || ''
    });
    setIsEditDeptOpen(true);
  };

  const handleEditDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateDepartment(activeDept.id, deptForm);
      showToast('success', 'Department Updated', `${deptForm.name} details saved.`);
      setIsEditDeptOpen(false);
      loadData();
      if (selectedDeptDetail && selectedDeptDetail.id === activeDept.id) {
        openDepartmentDetails(activeDept);
      }
    } catch (err) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  const handleCreateDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createDepartment(newDeptForm);
      showToast('success', 'Department Created', `New department ${newDeptForm.name} created successfully.`);
      setIsCreateDeptOpen(false);
      setNewDeptForm({ name: '', description: '', lead_member_id: '', co_lead_member_id: '', icon: 'Lightbulb' });
      loadData();
    } catch (err) {
      showToast('error', 'Creation Failed', err.message);
    }
  };

  const openAssignModal = (dept) => {
    setActiveDept(dept);
    setAssignMemberId('');
    setIsAssignMemberOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignMemberId) {
      showToast('error', 'Select Member', 'Please select a member to assign.');
      return;
    }
    try {
      await api.assignDeptMember(activeDept.id, assignMemberId);
      showToast('success', 'Member Assigned', `Member has been added to ${activeDept.name}.`);
      setIsAssignMemberOpen(false);
      loadData();
      if (selectedDeptDetail && selectedDeptDetail.id === activeDept.id) {
        openDepartmentDetails(activeDept);
      }
    } catch (err) {
      showToast('error', 'Assignment Failed', err.message);
    }
  };

  const handleRemoveMember = async (deptId, memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this department?`)) return;
    try {
      await api.removeDeptMember(deptId, memberId);
      showToast('success', 'Member Removed', `${memberName} unassigned from department.`);
      loadData();
      if (selectedDeptDetail && selectedDeptDetail.id === deptId) {
        openDepartmentDetails({ id: deptId });
      }
    } catch (err) {
      showToast('error', 'Failed to remove member', err.message);
    }
  };

  const openChangeLeadModal = (dept) => {
    setActiveDept(dept);
    setNewLeadId(dept.lead_member_id || '');
    setIsChangeLeadOpen(true);
  };

  const handleChangeLeadSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateDepartment(activeDept.id, { lead_member_id: newLeadId });
      showToast('success', 'Lead Assigned', `Department Lead for ${activeDept.name} updated.`);
      setIsChangeLeadOpen(false);
      loadData();
      if (selectedDeptDetail && selectedDeptDetail.id === activeDept.id) {
        openDepartmentDetails(activeDept);
      }
    } catch (err) {
      showToast('error', 'Lead Update Failed', err.message);
    }
  };

  const openChangeCoLead1Modal = (dept) => {
    setActiveDept(dept);
    setNewCoLead1Id(dept.co_lead_1_member_id || dept.co_lead_member_id || '');
    setIsChangeCoLead1Open(true);
  };

  const handleChangeCoLead1Submit = async (e) => {
    e.preventDefault();
    try {
      await api.updateDepartment(activeDept.id, { co_lead_1_member_id: newCoLead1Id });
      showToast('success', 'Co-Lead 1 Assigned', `Department Co-Lead 1 for ${activeDept.name} updated.`);
      setIsChangeCoLead1Open(false);
      await loadData();
      if (selectedDeptDetail && selectedDeptDetail.id === activeDept.id) {
        openDepartmentDetails(activeDept);
      }
    } catch (err) {
      showToast('error', 'Co-Lead 1 Update Failed', err.message);
    }
  };

  const openChangeCoLead2Modal = (dept) => {
    setActiveDept(dept);
    setNewCoLead2Id(dept.co_lead_2_member_id || '');
    setIsChangeCoLead2Open(true);
  };

  const handleChangeCoLead2Submit = async (e) => {
    e.preventDefault();
    try {
      await api.updateDepartment(activeDept.id, { co_lead_2_member_id: newCoLead2Id });
      showToast('success', 'Co-Lead 2 Assigned', `Department Co-Lead 2 for ${activeDept.name} updated.`);
      setIsChangeCoLead2Open(false);
      await loadData();
      if (selectedDeptDetail && selectedDeptDetail.id === activeDept.id) {
        openDepartmentDetails(activeDept);
      }
    } catch (err) {
      showToast('error', 'Co-Lead 2 Update Failed', err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-title-wrap">
          <h1>
            <Building2 size={26} color="var(--primary-light)" />
            STIC Departments &amp; Leadership Structure
          </h1>
          <p>
            The foundational collegiate wings driving sustainable innovation, projects, operations, and club leadership with appointed Leads and Co-Leads
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setIsCreateDeptOpen(true)}>
            <Plus size={15} /> Add Department
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px' }}>Loading departments and leadership roster...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {departments.map((dept) => {
            const Icon = getDeptIcon(dept.name);

            return (
              <div key={dept.id} className="stic-card" style={{ marginBottom: 0 }}>
                {/* Department Header Bar */}
                <div className="card-header-bar" style={{ background: 'var(--bg-surface-elevated)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-soft)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{dept.name}</h3>
                        <span className="badge badge-info">{dept.member_count} Members</span>
                        {dept.name.toLowerCase().includes('innovation') && (
                          <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            <Sparkles size={11} /> Projects &amp; Patents
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginTop: '3px', margin: 0, lineHeight: 1.4 }}>
                        {dept.description}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditDept(dept)}>
                      <Edit2 size={14} /> Edit Dept
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => openDepartmentDetails(dept)}>
                      <Users size={14} /> View Members ({dept.member_count})
                    </button>
                  </div>
                </div>

                {/* Department Leadership & Action Cards */}
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {/* 1. Department Lead Card */}
                    <div style={{
                      background: 'var(--bg-app)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          minWidth: '56px',
                          minHeight: '56px',
                          aspectRatio: '1 / 1',
                          borderRadius: '50%',
                          background: 'var(--bg-surface-elevated)',
                          border: '2.5px solid var(--primary-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          color: 'var(--primary-light)',
                          overflow: 'hidden',
                          flexShrink: 0,
                          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)'
                        }}>
                          {dept.lead_photo ? (
                            <img src={dept.lead_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          ) : (dept.lead_name ? dept.lead_name.charAt(0) : '?')}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--primary-light)', fontWeight: 800, letterSpacing: '0.04em' }}>
                              Department Lead
                            </span>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dept.lead_name ? 'var(--primary-light)' : 'var(--text-subtle)' }} />
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.94rem', color: dept.lead_name ? 'var(--text-main)' : 'var(--text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {dept.lead_name || 'No Lead Appointed'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {dept.lead_email || (dept.lead_college_id ? `ID: ${dept.lead_college_id}` : 'Vacant position')}
                          </div>
                        </div>
                      </div>

                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openChangeLeadModal(dept)}
                        title="Change Department Lead"
                        style={{ flexShrink: 0, fontSize: '0.74rem', padding: '6px 10px' }}
                      >
                        <UserCheck size={13} /> {dept.lead_name ? 'Change Lead' : 'Assign Lead'}
                      </button>
                    </div>

                    {/* 2. Department Co-Lead 1 Card */}
                    <div style={{
                      background: 'var(--bg-app)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          minWidth: '56px',
                          minHeight: '56px',
                          aspectRatio: '1 / 1',
                          borderRadius: '50%',
                          background: 'var(--bg-surface-elevated)',
                          border: '2.5px solid #38bdf8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          color: '#38bdf8',
                          overflow: 'hidden',
                          flexShrink: 0,
                          boxShadow: '0 4px 14px rgba(56, 189, 248, 0.2)'
                        }}>
                          {(dept.co_lead_1_photo || dept.co_lead_photo) ? (
                            <img src={dept.co_lead_1_photo || dept.co_lead_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          ) : ((dept.co_lead_1_name || dept.co_lead_name) ? (dept.co_lead_1_name || dept.co_lead_name).charAt(0) : '?')}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.04em' }}>
                              Co-Lead 1
                            </span>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: (dept.co_lead_1_name || dept.co_lead_name) ? '#38bdf8' : 'var(--text-subtle)' }} />
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.94rem', color: (dept.co_lead_1_name || dept.co_lead_name) ? 'var(--text-main)' : 'var(--text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {dept.co_lead_1_name || dept.co_lead_name || 'No Co-Lead 1 Appointed'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {dept.co_lead_1_email || dept.co_lead_email || (dept.co_lead_1_college_id ? `ID: ${dept.co_lead_1_college_id}` : 'Supports department lead')}
                          </div>
                        </div>
                      </div>

                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openChangeCoLead1Modal(dept)}
                        title="Change Department Co-Lead 1"
                        style={{ flexShrink: 0, fontSize: '0.74rem', padding: '6px 10px', borderColor: 'rgba(56, 189, 248, 0.35)', color: '#38bdf8' }}
                      >
                        <ShieldCheck size={13} /> {(dept.co_lead_1_name || dept.co_lead_name) ? 'Change Co-Lead 1' : 'Assign Co-Lead 1'}
                      </button>
                    </div>

                    {/* 3. Department Co-Lead 2 Card */}
                    <div style={{
                      background: 'var(--bg-app)',
                      border: '1px solid rgba(168, 85, 247, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          minWidth: '56px',
                          minHeight: '56px',
                          aspectRatio: '1 / 1',
                          borderRadius: '50%',
                          background: 'var(--bg-surface-elevated)',
                          border: '2.5px solid #c084fc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          color: '#c084fc',
                          overflow: 'hidden',
                          flexShrink: 0,
                          boxShadow: '0 4px 14px rgba(168, 85, 247, 0.2)'
                        }}>
                          {dept.co_lead_2_photo ? (
                            <img src={dept.co_lead_2_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          ) : (dept.co_lead_2_name ? dept.co_lead_2_name.charAt(0) : '?')}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#c084fc', fontWeight: 800, letterSpacing: '0.04em' }}>
                              Co-Lead 2
                            </span>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dept.co_lead_2_name ? '#c084fc' : 'var(--text-subtle)' }} />
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.94rem', color: dept.co_lead_2_name ? 'var(--text-main)' : 'var(--text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {dept.co_lead_2_name || 'No Co-Lead 2 Appointed'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {dept.co_lead_2_email || (dept.co_lead_2_college_id ? `ID: ${dept.co_lead_2_college_id}` : 'Supports department lead')}
                          </div>
                        </div>
                      </div>

                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openChangeCoLead2Modal(dept)}
                        title="Change Department Co-Lead 2"
                        style={{ flexShrink: 0, fontSize: '0.74rem', padding: '6px 10px', borderColor: 'rgba(168, 85, 247, 0.35)', color: '#c084fc' }}
                      >
                        <ShieldCheck size={13} /> {dept.co_lead_2_name ? 'Change Co-Lead 2' : 'Assign Co-Lead 2'}
                      </button>
                    </div>
                  </div>

                  {/* Quick Member Add Row */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openAssignModal(dept)}>
                      <UserPlus size={14} /> + Add Member to {dept.name}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================
          MODAL: DEPARTMENT FULL MEMBERS LIST
          ========================================================= */}
      {selectedDeptDetail && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={22} color="var(--primary-light)" />
                <div>
                  <h3 style={{ margin: 0 }}>{selectedDeptDetail.name}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', margin: 0 }}>
                    {selectedDeptDetail.member_count} enrolled members · Lead: {selectedDeptDetail.lead_name || 'Vacant'} · Co-Lead 1: {selectedDeptDetail.co_lead_1_name || selectedDeptDetail.co_lead_name || 'Vacant'} · Co-Lead 2: {selectedDeptDetail.co_lead_2_name || 'Vacant'}
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedDeptDetail(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>Enrolled Department Team</h4>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => openAssignModal(selectedDeptDetail)}
                >
                  <UserPlus size={14} /> Assign Another Member
                </button>
              </div>

              {selectedDeptDetail.members && selectedDeptDetail.members.length > 0 ? (
                <div className="table-responsive">
                  <table className="stic-table">
                    <thead>
                      <tr>
                        <th>Member Name</th>
                        <th>College ID</th>
                        <th>Academic Year</th>
                        <th>Position</th>
                        <th>Role in Dept</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDeptDetail.members.map((m) => {
                        const isLead = m.id === selectedDeptDetail.lead_member_id;
                        const isCoLead1 = m.id === (selectedDeptDetail.co_lead_1_member_id || selectedDeptDetail.co_lead_member_id);
                        const isCoLead2 = m.id === selectedDeptDetail.co_lead_2_member_id;

                        return (
                          <tr key={m.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.full_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{m.email}</div>
                            </td>
                            <td style={{ fontFamily: 'monospace' }}>{m.college_id}</td>
                            <td>{m.year} · {m.branch}</td>
                            <td>{m.position}</td>
                            <td>
                              {isLead ? (
                                <span className="badge badge-success"><UserCheck size={12} /> Lead</span>
                              ) : isCoLead1 ? (
                                <span className="badge badge-info" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                                  <ShieldCheck size={12} /> Co-Lead 1
                                </span>
                              ) : isCoLead2 ? (
                                <span className="badge badge-info" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                                  <ShieldCheck size={12} /> Co-Lead 2
                                </span>
                              ) : (
                                <span className="badge badge-neutral">Member</span>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRemoveMember(selectedDeptDetail.id, m.id, m.full_name)}
                                title="Remove from Department"
                              >
                                <UserMinus size={13} /> Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
                  No members assigned to this department yet. Click "Assign Another Member" to select from club registry.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedDeptDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: EDIT DEPARTMENT
          ========================================================= */}
      {isEditDeptOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Edit Department Information</h3>
              <button className="btn-icon" onClick={() => setIsEditDeptOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleEditDeptSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Department Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Department Description</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={deptForm.description}
                    onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Department Lead</label>
                  <select
                    className="form-select"
                    value={deptForm.lead_member_id}
                    onChange={(e) => setDeptForm({ ...deptForm, lead_member_id: e.target.value })}
                  >
                    <option value="">-- No Lead (Vacant) --</option>
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.college_id} - {m.year})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Department Co-Lead 1</label>
                  <select
                    className="form-select"
                    value={deptForm.co_lead_1_member_id}
                    onChange={(e) => setDeptForm({ ...deptForm, co_lead_1_member_id: e.target.value })}
                  >
                    <option value="">-- No Co-Lead 1 (Vacant) --</option>
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.college_id} - {m.year})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Department Co-Lead 2</label>
                  <select
                    className="form-select"
                    value={deptForm.co_lead_2_member_id}
                    onChange={(e) => setDeptForm({ ...deptForm, co_lead_2_member_id: e.target.value })}
                  >
                    <option value="">-- No Co-Lead 2 (Vacant) --</option>
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.college_id} - {m.year})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditDeptOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: CREATE NEW DEPARTMENT
          ========================================================= */}
      {isCreateDeptOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Create New Club Department</h3>
              <button className="btn-icon" onClick={() => setIsCreateDeptOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateDeptSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Department Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Project & Innovation"
                    value={newDeptForm.name}
                    onChange={(e) => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Department Description</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Describe the department's mission, responsibilities, and student engagement scope..."
                    value={newDeptForm.description}
                    onChange={(e) => setNewDeptForm({ ...newDeptForm, description: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Appoint Department Lead</label>
                  <select
                    className="form-select"
                    value={newDeptForm.lead_member_id}
                    onChange={(e) => setNewDeptForm({ ...newDeptForm, lead_member_id: e.target.value })}
                  >
                    <option value="">-- No Lead (Optional) --</option>
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.college_id} - {m.year})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Appoint Department Co-Lead 1</label>
                  <select
                    className="form-select"
                    value={newDeptForm.co_lead_1_member_id}
                    onChange={(e) => setNewDeptForm({ ...newDeptForm, co_lead_1_member_id: e.target.value })}
                  >
                    <option value="">-- No Co-Lead 1 (Optional) --</option>
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.college_id} - {m.year})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Appoint Department Co-Lead 2</label>
                  <select
                    className="form-select"
                    value={newDeptForm.co_lead_2_member_id}
                    onChange={(e) => setNewDeptForm({ ...newDeptForm, co_lead_2_member_id: e.target.value })}
                  >
                    <option value="">-- No Co-Lead 2 (Optional) --</option>
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.college_id} - {m.year})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateDeptOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ASSIGN MEMBER TO DEPARTMENT
          ========================================================= */}
      {isAssignMemberOpen && activeDept && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Assign Member to {activeDept.name}</h3>
              <button className="btn-icon" onClick={() => setIsAssignMemberOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAssignSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Select an enrolled member from the master STIC database to assign them to this department:
                </p>
                <div className="form-group">
                  <label className="form-label">Select Club Member</label>
                  <select
                    className="form-select"
                    required
                    value={assignMemberId}
                    onChange={(e) => setAssignMemberId(e.target.value)}
                  >
                    <option value="">-- Choose Member --</option>
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.college_id}) · {m.department_name ? `Currently: ${m.department_name}` : 'Unassigned'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAssignMemberOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Assign Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: CHANGE LEAD
          ========================================================= */}
      {isChangeLeadOpen && activeDept && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} color="var(--primary-light)" />
                <h3 style={{ margin: 0 }}>Change Department Lead</h3>
              </div>
              <button className="btn-icon" onClick={() => setIsChangeLeadOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleChangeLeadSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Select a club member to appoint as official <strong>Department Lead</strong> for <strong>{activeDept.name}</strong>:
                </p>
                <div className="form-group">
                  <label className="form-label">Select Lead Member</label>
                  <select
                    className="form-select"
                    value={newLeadId}
                    onChange={(e) => setNewLeadId(e.target.value)}
                  >
                    <option value="">-- No Lead (Vacant) --</option>
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.college_id} - {m.year})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsChangeLeadOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Set As Department Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: CHANGE CO-LEAD 1
          ========================================================= */}
      {isChangeCoLead1Open && activeDept && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#38bdf8" />
                <h3 style={{ margin: 0 }}>Change Department Co-Lead 1</h3>
              </div>
              <button className="btn-icon" onClick={() => setIsChangeCoLead1Open(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleChangeCoLead1Submit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Select a club member to appoint as official <strong>Department Co-Lead 1</strong> for <strong>{activeDept.name}</strong>:
                </p>
                <div className="form-group">
                  <label className="form-label">Select Co-Lead 1 Member</label>
                  <select
                    className="form-select"
                    value={newCoLead1Id}
                    onChange={(e) => setNewCoLead1Id(e.target.value)}
                  >
                    <option value="">-- No Co-Lead 1 (Vacant) --</option>
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.college_id} - {m.year})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsChangeCoLead1Open(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
                  Set As Department Co-Lead 1
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: CHANGE CO-LEAD 2
          ========================================================= */}
      {isChangeCoLead2Open && activeDept && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#c084fc" />
                <h3 style={{ margin: 0 }}>Change Department Co-Lead 2</h3>
              </div>
              <button className="btn-icon" onClick={() => setIsChangeCoLead2Open(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleChangeCoLead2Submit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Select a club member to appoint as official <strong>Department Co-Lead 2</strong> for <strong>{activeDept.name}</strong>:
                </p>
                <div className="form-group">
                  <label className="form-label">Select Co-Lead 2 Member</label>
                  <select
                    className="form-select"
                    value={newCoLead2Id}
                    onChange={(e) => setNewCoLead2Id(e.target.value)}
                  >
                    <option value="">-- No Co-Lead 2 (Vacant) --</option>
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.college_id} - {m.year})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsChangeCoLead2Open(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#9333ea', borderColor: '#9333ea' }}>
                  Set As Department Co-Lead 2
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
