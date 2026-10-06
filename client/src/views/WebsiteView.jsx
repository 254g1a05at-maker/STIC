import React, { useState, useEffect } from 'react';
import {
  Globe,
  Bell,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  Image,
  Video,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Sliders,
  AlertTriangle,
  Lightbulb,
  Building2
} from 'lucide-react';
import { api, authState } from '../api';

export default function WebsiteView({ showToast, setView }) {
  const user = authState.getUser();
  const permissions = user?.permissions || {};
  const isWebsiteHandler = user?.role === 'STIC Website Handler';

  const [activeTab, setActiveTab] = useState('announcements'); // 'announcements', 'content', 'sections'

  // Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Announcement',
    priority: 'normal',
    link_url: '',
    link_label: '',
    display_order: 0,
    is_active: true
  });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // Website Content Settings State
  const [websiteSettings, setWebsiteSettings] = useState({
    club_name: '',
    club_full_name: '',
    club_tagline: '',
    club_description: '',
    college_name: '',
    club_email: '',
    club_phone: '',
    website_announcement_ticker: ''
  });
  const [loadingContent, setLoadingContent] = useState(true);
  const [savingContent, setSavingContent] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    fetchWebsiteSettings();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const res = await api.getAnnouncements();
      setAnnouncements(res.data || []);
    } catch (err) {
      showToast('error', 'Error Loading Announcements', err.message);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const fetchWebsiteSettings = async () => {
    try {
      setLoadingContent(true);
      const res = await api.getSettings();
      if (res.data?.settings) {
        setWebsiteSettings(prev => ({
          ...prev,
          ...res.data.settings
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContent(false);
    }
  };

  // Open modal for new announcement
  const handleOpenAdd = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      category: 'Announcement',
      priority: 'normal',
      link_url: '',
      link_label: '',
      display_order: announcements.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  // Open modal for editing announcement
  const handleOpenEdit = (item) => {
    setEditingAnnouncement(item);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category || 'Announcement',
      priority: item.priority || 'normal',
      link_url: item.link_url || '',
      link_label: item.link_label || '',
      display_order: item.display_order || 0,
      is_active: Boolean(item.is_active)
    });
    setIsModalOpen(true);
  };

  // Save Announcement Handler
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('error', 'Validation Error', 'Title is required.');
      return;
    }
    if (!formData.content.trim()) {
      showToast('error', 'Validation Error', 'Content description is required.');
      return;
    }

    try {
      setSavingAnnouncement(true);
      if (editingAnnouncement) {
        await api.updateAnnouncement(editingAnnouncement.id, formData);
        showToast('success', 'Announcement Updated', 'The announcement has been updated on the website.');
      } else {
        await api.createAnnouncement(formData);
        showToast('success', 'Announcement Published', 'New announcement is now live on the website.');
      }
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      showToast('error', 'Save Failed', err.message);
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // Toggle Announcement Active Status
  const handleToggleActive = async (item) => {
    try {
      const res = await api.toggleAnnouncement(item.id);
      showToast('success', 'Status Updated', res.message);
      fetchAnnouncements();
    } catch (err) {
      showToast('error', 'Toggle Failed', err.message);
    }
  };

  // Delete Announcement Handler
  const handleDeleteAnnouncement = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the announcement "${title}" from the website?`)) {
      return;
    }
    try {
      await api.deleteAnnouncement(id);
      showToast('success', 'Announcement Removed', 'The announcement has been removed.');
      fetchAnnouncements();
    } catch (err) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  // Save Website Content Handler
  const handleSaveContent = async (e) => {
    e.preventDefault();
    try {
      setSavingContent(true);
      const data = new FormData();
      Object.keys(websiteSettings).forEach(k => {
        data.append(k, websiteSettings[k] || '');
      });
      await api.updateSettings(data);
      showToast('success', 'Website Content Saved', 'Website sections, tagline, and descriptions have been updated.');
    } catch (err) {
      showToast('error', 'Save Failed', err.message);
    } finally {
      setSavingContent(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    if (priority === 'urgent') return 'badge badge-rose';
    if (priority === 'high') return 'badge badge-amber';
    return 'badge badge-emerald';
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(14, 165, 233, 0.12)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}
          >
            <Globe size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="page-title" style={{ margin: 0 }}>
                Website & Announcements Management
              </h1>
              {isWebsiteHandler && (
                <span className="badge badge-sky" style={{ fontSize: '0.74rem', padding: '3px 10px' }}>
                  Technical Role Assigned
                </span>
              )}
            </div>
            <p className="page-subtitle" style={{ margin: '4px 0 0' }}>
              Manage website content, update relevant sections, and publish public notices and flash announcements.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>New Announcement</span>
          </button>
        </div>
      </div>

      {/* Role Notice Card */}
      <div
        style={{
          background: 'var(--accent-cyan-soft)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
      >
        <Info size={20} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45, fontWeight: 500 }}>
          <strong style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>STIC Website Management Scope:</strong> You have active authorization to manage website content, publish official announcements, and update website media sections (Photos, Videos, Documents, and Events showcase).
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-pills" style={{ marginBottom: '24px' }}>
        <button
          className={`tab-pill ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          <Bell size={16} />
          <span>Announcements & Notices ({announcements.length})</span>
        </button>
        <button
          className={`tab-pill ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          <Sliders size={16} />
          <span>Website Hero & Content</span>
        </button>
        <button
          className={`tab-pill ${activeTab === 'sections' ? 'active' : ''}`}
          onClick={() => setActiveTab('sections')}
        >
          <Layers size={16} />
          <span>Relevant Website Sections</span>
        </button>
      </div>

      {/* =========================================================
          TAB 1: ANNOUNCEMENTS & NOTICES
          ========================================================= */}
      {activeTab === 'announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>
              Published Website Announcements
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {announcements.filter(a => a.is_active).length} Active on Website
            </span>
          </div>

          {loadingAnnouncements ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>Loading website announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="stic-card" style={{ padding: '40px', textAlign: 'center' }}>
              <Bell size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <h3>No Announcements Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', maxWidth: '400px', margin: '6px auto 18px' }}>
                Create your first announcement to display on the STIC official web portal header and homepage.
              </p>
              <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
                <Plus size={15} /> Add First Announcement
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="stic-card"
                  style={{
                    padding: '18px 20px',
                    borderColor: item.is_active ? 'var(--border-subtle)' : 'rgba(100, 116, 139, 0.25)',
                    opacity: item.is_active ? 1 : 0.75,
                    background: item.is_active ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '260px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span className={getPriorityBadgeClass(item.priority)}>
                          {item.priority.toUpperCase()}
                        </span>
                        <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                          {item.category}
                        </span>
                        {item.is_active ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 600 }}>
                            <CheckCircle size={13} /> Active on Website
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                            <XCircle size={13} /> Hidden from Website
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginLeft: 'auto' }}>
                          Order: #{item.display_order} · Posted by: {item.created_by}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-main)' }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
                        {item.content}
                      </p>

                      {item.link_url && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--primary-light)' }}>
                          <ExternalLink size={13} />
                          <span>Link: {item.link_label || item.link_url} ({item.link_url})</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleToggleActive(item)}
                        title={item.is_active ? 'Hide from website' : 'Show on website'}
                      >
                        {item.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                        <span>{item.is_active ? 'Hide' : 'Publish'}</span>
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit announcement"
                      >
                        <Edit size={15} />
                        <span>Edit</span>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteAnnouncement(item.id, item.title)}
                        title="Delete announcement"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 2: WEBSITE HERO & CONTENT CUSTOMIZER
          ========================================================= */}
      {activeTab === 'content' && (
        <form onSubmit={handleSaveContent}>
          <div className="stic-card" style={{ padding: '28px', maxWidth: '850px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', fontWeight: 700 }}>
              Website Hero & Brand Messaging
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
              These texts are featured on the website landing hero banner, header tags, and institutional footer.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label">Club Title / Brand Display</label>
                <input
                  type="text"
                  className="form-input"
                  value={websiteSettings.club_name || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, club_name: e.target.value })}
                  placeholder="e.g. STIC – Innovate. Sustain. Impact."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Full Club Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={websiteSettings.club_full_name || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, club_full_name: e.target.value })}
                  placeholder="Sustainable Technology and Innovation Club"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Tagline</label>
                <input
                  type="text"
                  className="form-input"
                  value={websiteSettings.club_tagline || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, club_tagline: e.target.value })}
                  placeholder="Innovate with Purpose. Sustain with Vision. Impact the Future."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Website Mission Statement & About Text</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={websiteSettings.club_description || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, club_description: e.target.value })}
                  placeholder="Comprehensive description displayed on the website about section..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Official Contact Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={websiteSettings.club_email || ''}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, club_email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Official Contact Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={websiteSettings.club_phone || ''}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, club_phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingContent}
                >
                  <Save size={16} />
                  <span>{savingContent ? 'Saving Content...' : 'Save Website Content'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* =========================================================
          TAB 3: RELEVANT WEBSITE SECTIONS
          ========================================================= */}
      {activeTab === 'sections' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', margin: '0 0 6px', fontWeight: 700 }}>
              Website Media & Content Sections
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Quick jump to update relevant website showcase sections under your website management scope.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
            <div className="stic-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                  <Image size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Photos Showcase</h4>
                  <span style={{ fontSize: '0.74rem', color: '#34d399' }}>Public Website Gallery</span>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Manage photo albums, high-res captures from workshops and hackathons, and set the website Gallery DP banner.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'auto' }}
                onClick={() => setView('photos')}
              >
                Manage Website Photos
              </button>
            </div>

            <div className="stic-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <Video size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Videos Archive</h4>
                  <span style={{ fontSize: '0.74rem', color: '#38bdf8' }}>YouTube & Teasers</span>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Embed official YouTube video recaps, prototype demonstrations, and event teasers shown on the website.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'auto' }}
                onClick={() => setView('videos')}
              >
                Manage Website Videos
              </button>
            </div>

            <div className="stic-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Content & Documentation</h4>
                  <span style={{ fontSize: '0.74rem', color: '#fbbf24' }}>Templates & Reports</span>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Manage downloadable document templates, official circulars, event outcome briefs, and publications.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'auto' }}
                onClick={() => setView('documents')}
              >
                Manage Documents
              </button>
            </div>

            <div className="stic-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Programs & Events</h4>
                  <span style={{ fontSize: '0.74rem', color: '#fb7185' }}>Public Listings</span>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Review program schedules, event posters, venue listings, and descriptions displayed on the portal.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'auto' }}
                onClick={() => setView('programs')}
              >
                View Events Showcase
              </button>
            </div>

            <div className="stic-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)' }}>
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Project &amp; Innovation</h4>
                  <span style={{ fontSize: '0.74rem', color: 'var(--primary-light)' }}>Prototypes &amp; Patents</span>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Manage student engineering projects, smart green computing models, patents, and campus innovation challenge showcases.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'auto' }}
                onClick={() => setView('departments')}
              >
                Manage Projects &amp; Innovation
              </button>
            </div>

            <div className="stic-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Departments &amp; Leadership</h4>
                  <span style={{ fontSize: '0.74rem', color: '#38bdf8' }}>Leads &amp; Co-Leads</span>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Manage all 6 collegiate departments with designated Department Leads and Co-Leads, member rosters, and operational mandates.
              </p>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'auto' }}
                onClick={() => setView('departments')}
              >
                Manage All Departments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: CREATE / EDIT ANNOUNCEMENT
          ========================================================= */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={20} color="var(--primary-light)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                  {editingAnnouncement ? 'Edit Announcement' : 'Publish New Website Announcement'}
                </h3>
              </div>
              <button
                className="btn-icon"
                onClick={() => setIsModalOpen(false)}
                title="Close"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Announcement Headline *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. STIC Annual Induction Drive 2026"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Details / Description *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="Detailed information for students and visitors..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Announcement">General Announcement</option>
                      <option value="Induction">Induction / Recruitment</option>
                      <option value="Event Flash">Event Flash / Hackathon</option>
                      <option value="Notice">Official Notice</option>
                      <option value="Gallery Update">Gallery / Media Update</option>
                      <option value="Workshop">Workshop Alert</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority Level</label>
                    <select
                      className="form-input"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="normal">Normal Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent / Breaking</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Link URL (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. #programs or https://..."
                      value={formData.link_url}
                      onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Link Button Label</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Register Now"
                      value={formData.link_label}
                      onChange={(e) => setFormData({ ...formData, link_label: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span>Publish live on website immediately</span>
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Display Order:</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '70px', height: '32px', textAlign: 'center' }}
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingAnnouncement}
                >
                  <Save size={16} />
                  <span>{savingAnnouncement ? 'Saving...' : (editingAnnouncement ? 'Update Announcement' : 'Publish Announcement')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
