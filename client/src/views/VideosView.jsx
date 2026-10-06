import React, { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  Play,
  ExternalLink,
  Trash2,
  Calendar,
  X,
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Download,
  Film
} from 'lucide-react';
import { api } from '../api';
import ClubAnimationStudio from '../components/ClubAnimationStudio';

export default function VideosView({ showToast, allPrograms }) {
  const [videos, setVideos] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(true);

  // Animation Studio State
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
  const [showStudioInline, setShowStudioInline] = useState(true);

  // Video Archive DP State
  const [videoDp, setVideoDp] = useState('');
  const [isDpModalOpen, setIsDpModalOpen] = useState(false);
  const [dpFile, setDpFile] = useState(null);
  const [customDpUrl, setCustomDpUrl] = useState('');
  const [dpUploading, setDpUploading] = useState(false);

  // Add Video Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [programId, setProgramId] = useState('');
  const [videoFile, setVideoFile] = useState(null);

  useEffect(() => {
    fetchVideos();
    fetchVideoDp();
  }, [selectedProgram]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedProgram) params.program_id = selectedProgram;
      const res = await api.getVideos(params);
      setVideos(res.data || []);
    } catch (err) {
      showToast('error', 'Error fetching videos', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoDp = async () => {
    try {
      const res = await api.getSettings();
      const settings = res.data?.settings || {};
      setVideoDp(settings.video_dp_url || '');
    } catch (err) {
      // Background settings fetch
    }
  };

  // Upload / Change Video Archive DP Submit
  const handleSaveVideoDp = async (e) => {
    e.preventDefault();
    if (!dpFile && !customDpUrl.trim()) {
      showToast('error', 'Selection Required', 'Please select an image file to upload or enter an image URL.');
      return;
    }

    try {
      setDpUploading(true);
      let res;
      if (dpFile) {
        const formData = new FormData();
        formData.append('dp', dpFile);
        res = await api.setVideoDp(formData);
      } else {
        res = await api.setVideoDp({ dp_url: customDpUrl.trim() });
      }

      setVideoDp(res.video_dp_url);
      showToast('success', 'Video Archive DP Updated!', 'Your Video Archive visual identity image has been saved.');
      setIsDpModalOpen(false);
      setDpFile(null);
      setCustomDpUrl('');
    } catch (err) {
      showToast('error', 'DP Update Failed', err.message);
    } finally {
      setDpUploading(false);
    }
  };

  // Remove Video Archive DP
  const handleRemoveVideoDp = async () => {
    if (!window.confirm('Are you sure you want to remove the Video Archive DP?')) return;
    try {
      await api.removeVideoDp();
      setVideoDp('');
      showToast('success', 'Video Archive DP Removed', 'The Video Archive DP has been cleared.');
    } catch (err) {
      showToast('error', 'Remove Failed', err.message);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      showToast('error', 'Validation Error', 'Title is required.');
      return;
    }

    try {
      if (videoFile) {
        const data = new FormData();
        data.append('title', title);
        if (description) data.append('description', description);
        if (programId) data.append('program_id', programId);
        data.append('video', videoFile);
        await api.createVideo(data);
      } else if (videoUrl) {
        await api.createVideo({
          title,
          description,
          video_url: videoUrl,
          program_id: programId || null
        });
      } else {
        showToast('error', 'Validation Error', 'Provide a video file or link.');
        return;
      }

      showToast('success', 'Video Added', `"${title}" has been saved.`);
      setIsAddOpen(false);
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setVideoFile(null);
      fetchVideos();
    } catch (err) {
      showToast('error', 'Failed to save video', err.message);
    }
  };

  const handleDelete = async (vidId) => {
    if (!window.confirm('Are you sure you want to delete this video recording?')) return;
    try {
      await api.deleteVideo(vidId);
      showToast('success', 'Video Deleted', 'Video record removed.');
      fetchVideos();
    } catch (err) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header-row no-print" style={{ alignItems: 'center' }}>
        <div className="page-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <Video size={24} />
            </div>
            <div>
              <h1>VIDEO ARCHIVES</h1>
              <p>Keynotes, hackathon pitches, prototype walkthroughs, and video recordings archive</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={() => setIsStudioModalOpen(true)}>
            <Sparkles size={16} /> Open Animation Studio
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
            <Plus size={16} /> + Add Video
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FEATURED: OFFICIAL STIC CLUB BRAND ANIMATION                 */}
      {/* ============================================================ */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(56, 189, 248, 0.05) 50%, rgba(249, 115, 22, 0.06) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Official Club Identity
                </span>
                <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  Clean Modern & Academic (1080p HD)
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '6px 0 2px 0', color: 'var(--text-main)' }}>
                Official STIC Club Brand Animation & Motion Graphics
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0 }}>
                CSE Department · Srinivasa Ramanujan Institute of Technology · "Innovate with Purpose. Sustain with Vision. Impact the Future."
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowStudioInline(!showStudioInline)}
              >
                {showStudioInline ? 'Collapse Player' : 'Expand Player'}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsStudioModalOpen(true)}
              >
                <Maximize2 size={14} /> Fullscreen Studio
              </button>
              <a
                href="/stic-animation.mp4?v=2"
                download="STIC_SRIT_Official_Animation.mp4"
                className="btn btn-outline btn-sm"
                style={{ textDecoration: 'none' }}
              >
                <Download size={14} /> Download Video
              </a>
            </div>
          </div>

          {showStudioInline && (
            <div style={{ marginTop: '16px' }}>
              <ClubAnimationStudio autoPlay={true} />
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. DEDICATED SECTION: VIDEO ARCHIVE DP                       */}
      {/* ============================================================ */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-highlight)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}
        >
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-info">Video Identity</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Video Archive DP
                </h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
                Dedicated profile/cover image for the Video Archives. Independent of the Photo Gallery DP.
              </p>
            </div>

            {/* DP Action Buttons: Upload DP / Change DP, Remove DP */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setIsDpModalOpen(true)}>
                <Upload size={14} />
                <span>{videoDp ? 'Change DP' : 'Upload DP'}</span>
              </button>

              {videoDp && (
                <button className="btn btn-outline btn-sm" onClick={handleRemoveVideoDp} style={{ color: 'var(--danger)' }}>
                  <Trash2 size={14} />
                  <span>Remove DP</span>
                </button>
              )}
            </div>
          </div>

          {/* Display Banner / Card */}
          {videoDp ? (
            <div
              style={{
                position: 'relative',
                height: '200px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                background: '#090d16'
              }}
            >
              <img
                src={videoDp}
                alt="Video Archive DP"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '110px',
                      height: '110px',
                      minWidth: '110px',
                      minHeight: '110px',
                      aspectRatio: '1 / 1',
                      borderRadius: '50%',
                      border: '4px solid #38bdf8',
                      overflow: 'hidden',
                      background: '#000',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      flexShrink: 0
                    }}
                  >
                    <img src={videoDp} alt="Video Archive Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  </div>
                  <div>
                    <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.15rem' }}>
                      STIC Video Archives DP
                    </div>
                    <div style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Active Video Archive Identity
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                background: 'var(--bg-main)',
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <Camera size={42} style={{ color: '#38bdf8', margin: '0 auto 10px' }} />
              <h4 style={{ color: 'var(--text-main)', fontWeight: 700, margin: '0 0 4px 0' }}>No Video Archive DP Set</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 16px 0', maxWidth: '440px', marginInline: 'auto' }}>
                Set a dedicated DP for your Video Archives section. Upload an image or enter an image URL.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => setIsDpModalOpen(true)}>
                <Upload size={14} />
                <span>Upload DP</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MAIN SECTION: ARCHIVED VIDEOS GRID                         */}
      {/* ============================================================ */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Archived Videos ({videos.length})
          </h2>

          {/* Filter Bar */}
          <div className="filter-bar" style={{ margin: 0 }}>
            <select
              className="filter-select"
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
            >
              <option value="">All Programs ({allPrograms?.length || 0})</option>
              {(allPrograms || []).map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.program_code})</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '12px' }}>Loading video records...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="stic-card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            <Video size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h3>No Video Recordings Linked</h3>
            <p style={{ marginTop: '4px', fontSize: '0.88rem' }}>Click "+ Add Video" to archive YouTube or Drive presentations.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {videos.map((v) => (
              <div key={v.id} className="stic-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '1.05rem', lineHeight: 1.35, color: 'var(--text-main)' }}>{v.title}</h3>
                    <span className="badge badge-info">{v.video_type === 'file' ? 'Uploaded File' : 'Stream Link'}</span>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--primary-light)', fontWeight: 600, marginBottom: '10px' }}>
                    {v.program_name ? `${v.program_name} (${v.program_code})` : 'STIC General Broadcast'}
                  </div>

                  {v.description && (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {v.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface-elevated)' }}>
                  {v.video_url && (
                    v.video_url.includes('stic-animation') ? (
                      <button
                        type="button"
                        onClick={() => setIsStudioModalOpen(true)}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <Play size={13} fill="currentColor" />
                        <span>Watch Broadcast</span>
                      </button>
                    ) : (
                      <a
                        href={v.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
                      >
                        <Play size={13} fill="currentColor" />
                        <span>Watch Broadcast</span>
                      </a>
                    )
                  )}
                  <button
                    className="btn btn-outline btn-sm btn-icon"
                    onClick={() => handleDelete(v.id)}
                    style={{ color: 'var(--danger)' }}
                    title="Delete Video"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: UPLOAD / CHANGE VIDEO ARCHIVE DP                      */}
      {/* ============================================================ */}
      {isDpModalOpen && (
        <div className="modal-backdrop no-print" onClick={() => setIsDpModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{videoDp ? 'Change Video Archive DP' : 'Upload Video Archive DP'}</h2>
              <button className="btn-icon" onClick={() => setIsDpModalOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveVideoDp}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Select Image File</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={(e) => setDpFile(e.target.files[0] || null)}
                  />
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Upload a high quality image file to use as the Video Archive DP.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Or Image URL</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://images.unsplash.com/..."
                    value={customDpUrl}
                    onChange={(e) => setCustomDpUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsDpModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={dpUploading}>
                  {dpUploading ? 'Saving...' : 'Set Video Archive DP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {isAddOpen && (
        <div className="modal-backdrop no-print" onClick={() => setIsAddOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>+ Add Video Broadcast</h2>
              <button className="btn-icon" onClick={() => setIsAddOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label required">Video Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Sustainathon 2026 Pitch Presentations"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Related Program</label>
                  <select
                    className="form-control"
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                  >
                    <option value="">General STIC Broadcast (No Program)</option>
                    {(allPrograms || []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.program_code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Video URL (YouTube / Google Drive)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Or Upload Video File</label>
                  <input
                    type="file"
                    accept="video/*"
                    className="form-control"
                    onChange={(e) => setVideoFile(e.target.files[0])}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Summary</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Brief description of the recorded presentation..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Video</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FULL ANIMATION STUDIO */}
      {isStudioModalOpen && (
        <div className="modal-backdrop no-print" onClick={() => setIsStudioModalOpen(false)} style={{ zIndex: 1100 }}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '1120px', width: '95vw', padding: 0, overflow: 'hidden', background: '#090d16', border: '1px solid rgba(56, 189, 248, 0.3)' }}
          >
            <ClubAnimationStudio onClose={() => setIsStudioModalOpen(false)} autoPlay={true} />
          </div>
        </div>
      )}
    </div>
  );
}
