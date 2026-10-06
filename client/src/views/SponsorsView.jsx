import React, { useState, useEffect } from 'react';
import {
  HandCoins,
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  Calendar,
  Building,
  Edit2,
  Trash2,
  FileCheck,
  IndianRupee,
  X
} from 'lucide-react';
import { api } from '../api';

export default function SponsorsView({ showToast, allPrograms, openAddTrigger, onCloseAddTrigger }) {
  const [sponsors, setSponsors] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    sponsor_name: '',
    contact_person: '',
    phone: '',
    email: '',
    amount: '',
    sponsorship_date: new Date().toISOString().split('T')[0],
    program_id: '',
    sponsorship_type: 'Gold Sponsor',
    notes: ''
  });
  const [agreementFile, setAgreementFile] = useState(null);

  useEffect(() => {
    fetchSponsors();
  }, [search, programFilter]);

  useEffect(() => {
    if (openAddTrigger) {
      handleOpenAddModal();
      if (onCloseAddTrigger) onCloseAddTrigger();
    }
  }, [openAddTrigger]);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (programFilter) params.program_id = programFilter;

      const res = await api.getSponsors(params);
      setSponsors(res.data || []);
      setTotalAmount(res.total_sponsorship_amount || 0);
    } catch (err) {
      showToast('error', 'Error fetching sponsors', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  const handleOpenAddModal = () => {
    setEditingSponsor(null);
    setFormData({
      sponsor_name: '',
      contact_person: '',
      phone: '',
      email: '',
      amount: '',
      sponsorship_date: new Date().toISOString().split('T')[0],
      program_id: allPrograms && allPrograms.length > 0 ? allPrograms[0].id : '',
      sponsorship_type: 'Gold Sponsor',
      notes: ''
    });
    setAgreementFile(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (s) => {
    setEditingSponsor(s);
    setFormData({
      sponsor_name: s.sponsor_name,
      contact_person: s.contact_person || '',
      phone: s.phone || '',
      email: s.email || '',
      amount: s.amount,
      sponsorship_date: s.sponsorship_date,
      program_id: s.program_id || '',
      sponsorship_type: s.sponsorship_type || 'Gold Sponsor',
      notes: s.notes || ''
    });
    setAgreementFile(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sponsor_name || !formData.sponsorship_date) {
      showToast('error', 'Validation Error', 'Sponsor name and date are required.');
      return;
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach(k => {
        data.append(k, formData[k] !== null ? formData[k] : '');
      });
      if (agreementFile) {
        data.append('agreement', agreementFile);
      }

      if (editingSponsor) {
        await api.updateSponsor(editingSponsor.id, data);
        showToast('success', 'Sponsor Updated', 'Sponsorship details modified.');
      } else {
        await api.createSponsor(data);
        showToast('success', 'Sponsor Added', `${formData.sponsor_name} registered.`);
      }

      setIsFormOpen(false);
      fetchSponsors();
    } catch (err) {
      showToast('error', 'Failed to save sponsor', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      await api.deleteSponsor(deleteCandidate.id);
      showToast('success', 'Sponsor Removed', 'Sponsor record deleted.');
      setDeleteCandidate(null);
      fetchSponsors();
    } catch (err) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-title-wrap">
          <h1>
            <HandCoins size={26} color="var(--primary-light)" />
            Sponsorship & Corporate Grants
          </h1>
          <p>
            Total Sponsorship Raised: <strong style={{ color: '#34d399' }}>{formatINR(totalAmount)}</strong> across {sponsors.length} corporate partner(s)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} /> + Add Sponsor
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-search-box">
          <Search size={16} className="search-icon-pos" />
          <input
            type="text"
            placeholder="Search by sponsor name, contact, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
        >
          <option value="">All Programs Sponsored</option>
          {(allPrograms || []).map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.program_code})</option>
          ))}
        </select>
      </div>

      {/* Sponsors Table / Cards */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px' }}>Loading sponsors...</p>
        </div>
      ) : sponsors.length === 0 ? (
        <div className="stic-card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-subtle)' }}>
          <HandCoins size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3>No Sponsors Recorded</h3>
          <p style={{ marginTop: '4px', fontSize: '0.88rem' }}>Click "+ Add Sponsor" to register corporate grant partners.</p>
        </div>
      ) : (
        <div className="stic-card" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="stic-table">
              <thead>
                <tr>
                  <th>Sponsor & Company</th>
                  <th>Tier / Type</th>
                  <th>Amount</th>
                  <th>Sponsored Program</th>
                  <th>Contact Person</th>
                  <th>Date</th>
                  <th>Agreement</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sponsors.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                        {s.sponsor_name}
                      </div>
                      {s.notes && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>{s.notes}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">{s.sponsorship_type}</span>
                    </td>
                    <td style={{ fontWeight: 800, color: '#34d399', fontSize: '0.95rem' }}>
                      {formatINR(s.amount)}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {s.program_name ? (
                        <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{s.program_name}</span>
                      ) : 'General Club Sponsorship'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div>{s.contact_person || '—'}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>{s.email} {s.phone ? `· ${s.phone}` : ''}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{s.sponsorship_date}</td>
                    <td>
                      {s.agreement_url ? (
                        <a href={s.agreement_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
                          Agreement
                        </a>
                      ) : <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>None</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-icon" onClick={() => handleOpenEditModal(s)} title="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button className="btn-icon" onClick={() => setDeleteCandidate(s)} title="Delete">
                          <Trash2 size={13} style={{ color: '#fb7185' }} />
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

      {/* Add / Edit Sponsor Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                <HandCoins size={20} color="var(--primary-light)" />
                {editingSponsor ? `Edit Sponsor: ${editingSponsor.sponsor_name}` : 'Register New Sponsor'}
              </h3>
              <button className="btn-icon" onClick={() => setIsFormOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label className="form-label">Sponsor Company / Organization *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. EcoTech Solutions Pvt Ltd"
                      value={formData.sponsor_name}
                      onChange={(e) => setFormData({ ...formData, sponsor_name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sponsorship Tier</label>
                    <select
                      className="form-select"
                      value={formData.sponsorship_type}
                      onChange={(e) => setFormData({ ...formData, sponsorship_type: e.target.value })}
                    >
                      <option value="Title Sponsor">Title Sponsor</option>
                      <option value="Gold Sponsor">Gold Sponsor</option>
                      <option value="Silver Sponsor">Silver Sponsor</option>
                      <option value="Associate Sponsor">Associate Sponsor</option>
                      <option value="In-Kind Partner">In-Kind Partner</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contribution Amount (₹ INR) *</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      required
                      placeholder="e.g. 25000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Agreement Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={formData.sponsorship_date}
                      onChange={(e) => setFormData({ ...formData, sponsorship_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sponsored Program</label>
                    <select
                      className="form-select"
                      value={formData.program_id}
                      onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                    >
                      <option value="">General Club Sponsorship</option>
                      {(allPrograms || []).map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.program_code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Person Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Mr. Rajesh Nair"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="e.g. +91 98760 11223"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group form-full">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. sponsorships@ecotech.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group form-full">
                    <label className="form-label">Agreement / MoU Document File</label>
                    <input
                      type="file"
                      className="form-input"
                      onChange={(e) => setAgreementFile(e.target.files[0] || null)}
                    />
                  </div>

                  <div className="form-group form-full">
                    <label className="form-label">Deliverables & Notes</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Logo placement on banners, booth space in innovation expo, keynote slots..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingSponsor ? 'OK / Save Changes' : 'OK / Submit Sponsor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteCandidate && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#fb7185' }}>Delete Sponsor</h3>
              <button className="btn-icon" onClick={() => setDeleteCandidate(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Delete sponsor <strong>{deleteCandidate.sponsor_name}</strong> ({formatINR(deleteCandidate.amount)})?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteCandidate(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>OK / Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
