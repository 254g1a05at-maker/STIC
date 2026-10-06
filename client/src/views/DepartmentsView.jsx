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
  X,
  Plus,
  Sparkles
} from 'lucide-react';
import { api } from '../api';

export default function DepartmentsView({ showToast }) {
  const [departments, setDepartments] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedDeptDetail, setSelectedDeptDetail] = useState(null);
  const [isEditDeptOpen, setIsEditDeptOpen] = useState(false);
  const [isAssignMemberOpen, setIsAssignMemberOpen] = useState(false);
  const [isChangeLeadOpen, setIsChangeLeadOpen] = useState(false);
  const [activeDept, setActiveDept] = useState(null);

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', description: '', lead_member_id: '' });
  const [assignMemberId, setAssignMemberId] = useState('');
  const [newLeadId, setNewLeadId] = useState('');

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
    } catch (err) {
      showToast('error', 'Failed to load department data', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDeptIcon = (name) => {
    if (name.includes('Content') || name.includes('Documentation')) return FileText;
    if (name.includes('Finance') || name.includes('Sponsorship')) return IndianRupee;
    if (name.includes('Social') || name.includes('Publicity')) return Share2;
    if (name.includes('Technical') || name.includes('Innovation')) return Cpu;
    if (name.includes('Event') || name.includes('Coordinator')) return CalendarCheck;
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
      lead_member_id: dept.lead_member_id || ''
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
      showToast('success', 'Lead Assigned', `Department lead for ${activeDept.name} updated.`);
      setIsChangeLeadOpen(false);
      loadData();
      if (selectedDeptDetail && selectedDeptDetail.id === activeDept.id) {
        openDepartmentDetails(activeDept);
      }
    } catch (err) {
      showToast('error', 'Lead Update Failed', err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-title-wrap">
          <h1>
            <Building2 size={26} color="var(--primary-light)" />
            STIC Departments & Team Structure
          </h1>
          <p>
            The 5 foundational collegiate divisions driving sustainable innovation, operations, and leadership
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px' }}>Loading departments...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {departments.map((dept, idx) => {
            const Icon = getDeptIcon(dept.name);

            return (
              <div key={dept.id} className="stic-card" style={{ marginBottom: 0 }}>
                <div className="card-header-bar" style={{ background: 'var(--bg-surface-elevated)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-soft)', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.2rem' }}>{dept.name}</h3>
                        <span className="badge badge-info">{dept.member_count} Members</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                        {dept.description}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditDept(dept)}>
                      <Edit2 size={14} /> Edit Dept
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => openDepartmentDetails(dept)}>
                      <Users size={14} /> View Members ({dept.member_count})
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', alignItems: 'center' }}>
                    {/* Lead Card */}
                    <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px', aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '2.5px solid var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary-light)', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)' }}>
                          {dept.lead_photo ? (
                            <img src={dept.lead_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          ) : (dept.lead_name ? dept.lead_name.charAt(0) : '?')}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 700 }}>
                            Department Lead
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.96rem', color: dept.lead_name ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                            {dept.lead_name || 'No Lead Appointed'}
                          </div>
                          {dept.lead_email && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dept.lead_email}</div>
                          )}
                        </div>
                      </div>

                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openChangeLeadModal(dept)}
                        title="Change Department Lead"
                      >
                        <UserCheck size={14} /> Change Lead
                      </button>
                    </div>

                    {/* Quick Member Actions */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openAssignModal(dept)}>
                        <UserPlus size={15} /> + Add Member from Club
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Department Full Members List Modal */}
      {selectedDeptDetail && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={22} color="var(--primary-light)" />
                <div>
                  <h3>{selectedDeptDetail.name}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                    {selectedDeptDetail.member_count} enrolled members · Lead: {selectedDeptDetail.lead_name || 'Unassigned'}
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedDeptDetail(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Enrolled Team Members</h4>
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
                      {selectedDeptDetail.members.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.full_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{m.email}</div>
                          </td>
                          <td style={{ fontFamily: 'monospace' }}>{m.college_id}</td>
                          <td>{m.year} · {m.branch}</td>
                          <td>{m.position}</td>
                          <td>
                            {m.id === selectedDeptDetail.lead_member_id ? (
                              <span className="badge badge-success"><UserCheck size={12} /> Lead</span>
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
                      ))}
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

      {/* Edit Department Modal */}
      {isEditDeptOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
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
                    value={deptForm.description}
                    onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  />
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

      {/* Assign Member Modal */}
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

      {/* Change Lead Modal */}
      {isChangeLeadOpen && activeDept && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Change Department Lead: {activeDept.name}</h3>
              <button className="btn-icon" onClick={() => setIsChangeLeadOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleChangeLeadSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Select an existing club member to appoint as the official Lead for <strong>{activeDept.name}</strong>:
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
                <button type="submit" className="btn btn-primary">Set As Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
