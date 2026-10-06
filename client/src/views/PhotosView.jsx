import React, { useState, useEffect } from 'react';
import {
  Image,
  Plus,
  Trash2,
  X,
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  Layers
} from 'lucide-react';
import { api } from '../api';

export default function PhotosView({ showToast, allPrograms, openAddTrigger, onCloseAddTrigger }) {
  const [photos, setPhotos] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(true);

  // Gallery DP State
  const [galleryDp, setGalleryDp] = useState('');
  const [isDpModalOpen, setIsDpModalOpen] = useState(false);
  const [dpFile, setDpFile] = useState(null);
  const [selectedExistingPhotoUrl, setSelectedExistingPhotoUrl] = useState('');
  const [dpUploading, setDpUploading] = useState(false);
  const [dpTab, setDpTab] = useState('upload'); // 'upload' or 'select'
  const [photoShape, setPhotoShape] = useState('circle'); // 'circle' | 'rect'

  // Photo Upload Modal & Lightbox
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [programId, setProgramId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  useEffect(() => {
    fetchPhotos();
    fetchGalleryDp();
  }, [selectedProgram]);

  useEffect(() => {
    if (openAddTrigger) {
      setIsAddOpen(true);
      if (onCloseAddTrigger) onCloseAddTrigger();
    }
  }, [openAddTrigger]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedProgram) params.program_id = selectedProgram;
      const res = await api.getPhotos(params);
      setPhotos(res.data || []);
    } catch (err) {
      showToast('error', 'Error fetching photos', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGalleryDp = async () => {
    try {
      const res = await api.getSettings();
      const settings = res.data?.settings || {};
      setGalleryDp(settings.gallery_dp_url || '');
    } catch (err) {
      // Background settings fetch
    }
  };

  // Upload or Change Gallery DP Submit
  const handleSaveGalleryDp = async (e) => {
    e.preventDefault();
    if (!dpFile && !selectedExistingPhotoUrl) {
      showToast('error', 'Selection Required', 'Please select an image file to upload or choose an existing photo.');
      return;
    }

    try {
      setDpUploading(true);
      let res;
      if (dpFile) {
        const formData = new FormData();
        formData.append('dp', dpFile);
        res = await api.setGalleryDp(formData);
      } else {
        res = await api.setGalleryDp({ dp_url: selectedExistingPhotoUrl });
      }

      setGalleryDp(res.gallery_dp_url);
      showToast('success', 'Gallery DP Updated!', 'Your Photo Gallery visual identity image has been saved.');
      setIsDpModalOpen(false);
      setDpFile(null);
      setSelectedExistingPhotoUrl('');
    } catch (err) {
      showToast('error', 'DP Update Failed', err.message);
    } finally {
      setDpUploading(false);
    }
  };

  // Remove Gallery DP
  const handleRemoveGalleryDp = async () => {
    if (!window.confirm('Are you sure you want to remove the Gallery DP?')) return;
    try {
      await api.removeGalleryDp();
      setGalleryDp('');
      showToast('success', 'Gallery DP Removed', 'The Gallery DP has been cleared.');
    } catch (err) {
      showToast('error', 'Remove Failed', err.message);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      if (programId) data.append('program_id', programId);
      if (photoCaption) data.append('caption', photoCaption);
      if (photoUrl) data.append('photo_url', photoUrl);
      if (photoFiles && photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i++) {
          data.append('photo', photoFiles[i]);
        }
      }

      await api.uploadPhotos(data);
      showToast('success', 'Photos Added', 'Photographs added to club gallery.');
      setIsAddOpen(false);
      setPhotoCaption('');
      setPhotoUrl('');
      setPhotoFiles([]);
      fetchPhotos();
    } catch (err) {
      showToast('error', 'Upload Failed', err.message);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photograph?')) return;
    try {
      await api.deletePhoto(photoId);
      showToast('success', 'Photo Deleted', 'Photograph removed from gallery.');
      fetchPhotos();
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
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399'
              }}
            >
              <Image size={24} />
            </div>
            <div>
              <h1>PHOTO GALLERY</h1>
              <p>Official visual photo archive of STIC workshops, hackathons, and campus initiatives</p>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          <Plus size={16} /> + Upload Photos
        </button>
      </div>

      {/* ============================================================ */}
      {/* 1. DEDICATED SECTION: GALLERY DP                             */}
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
                <span className="badge badge-emerald">Visual Identity</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Gallery DP
                </h2>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '4px 0 0 0' }}>
                Dedicated profile/cover image for the STIC Photo Gallery. Kept completely separate from normal gallery photos.
              </p>
            </div>

            {/* DP Action Buttons: Upload DP / Change DP, Remove DP */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setIsDpModalOpen(true)}>
                <Upload size={14} />
                <span>{galleryDp ? 'Change DP' : 'Upload DP'}</span>
              </button>

              {galleryDp && (
                <button className="btn btn-outline btn-sm" onClick={handleRemoveGalleryDp} style={{ color: 'var(--danger)' }}>
                  <Trash2 size={14} />
                  <span>Remove DP</span>
                </button>
              )}
            </div>
          </div>

          {/* Display Banner / Card */}
          {galleryDp ? (
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
                src={galleryDp}
                alt="Gallery DP"
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
                      border: '4px solid #34d399',
                      overflow: 'hidden',
                      background: '#000',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      flexShrink: 0
                    }}
                  >
                    <img src={galleryDp} alt="Gallery Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  </div>
                  <div>
                    <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.15rem' }}>
                      STIC Photo Gallery DP
                    </div>
                    <div style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Active Gallery Profile Image
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
              <Camera size={42} style={{ color: '#34d399', margin: '0 auto 10px' }} />
              <h4 style={{ color: 'var(--text-main)', fontWeight: 700, margin: '0 0 4px 0' }}>No Gallery DP Set</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 16px 0', maxWidth: '440px', marginInline: 'auto' }}>
                Set a dedicated DP for your Photo Gallery. You can upload a new picture or pick one from your existing photos.
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
      {/* 2. MAIN SECTION: PHOTOS GRID                                 */}
      {/* ============================================================ */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Photos ({photos.length})
          </h2>

          {/* Filter Bar & Shape Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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

            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-surface-elevated)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className={`btn btn-sm ${photoShape === 'circle' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                onClick={() => setPhotoShape('circle')}
              >
                ● Big Large Circle
              </button>
              <button
                type="button"
                className={`btn btn-sm ${photoShape === 'rect' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                onClick={() => setPhotoShape('rect')}
              >
                ■ Classic Card
              </button>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '12px' }}>Loading visual gallery...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="stic-card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-subtle)' }}>
            <Image size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h3>No Photos Found</h3>
            <p style={{ marginTop: '4px', fontSize: '0.88rem' }}>Upload photos from recent STIC workshops or initiatives.</p>
          </div>
        ) : (
          <div className="photo-gallery-grid">
            {photos.map((p) => (
              <div
                key={p.id}
                className={`photo-gallery-item ${photoShape === 'rect' ? 'shape-rect' : ''}`}
                style={photoShape === 'circle' ? {
                  width: '290px',
                  height: '290px',
                  minWidth: '290px',
                  minHeight: '290px',
                  aspectRatio: '1 / 1',
                  borderRadius: '50%'
                } : {}}
                onClick={() => setLightboxPhoto(p)}
              >
                <img
                  src={p.photo_url}
                  alt={p.caption || 'STIC Photo'}
                  loading="lazy"
                  style={photoShape === 'circle' ? { borderRadius: '50%' } : {}}
                />
                <div className="photo-caption-bar">
                  <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{p.caption || 'Event Photograph'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                    {p.program_name ? `${p.program_name} (${p.program_code})` : 'General Club Archive'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: UPLOAD / CHANGE GALLERY DP                            */}
      {/* ============================================================ */}
      {isDpModalOpen && (
        <div className="modal-backdrop no-print" onClick={() => setIsDpModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{galleryDp ? 'Change Gallery DP' : 'Upload Gallery DP'}</h2>
              <button className="btn-icon" onClick={() => setIsDpModalOpen(false)}><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tab selector: Upload File vs Select Existing */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <button
                  type="button"
                  className={`tab-btn ${dpTab === 'upload' ? 'active' : ''}`}
                  onClick={() => { setDpTab('upload'); setSelectedExistingPhotoUrl(''); }}
                >
                  <Upload size={14} /> Upload New File
                </button>
                <button
                  type="button"
                  className={`tab-btn ${dpTab === 'select' ? 'active' : ''}`}
                  onClick={() => { setDpTab('select'); setDpFile(null); }}
                >
                  <Image size={14} /> Choose From Gallery Photos ({photos.length})
                </button>
              </div>

              {dpTab === 'upload' ? (
                <div className="form-group">
                  <label className="form-label required">Select Image File</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={(e) => setDpFile(e.target.files[0] || null)}
                  />
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Supports JPG, PNG, WEBP images. Will be saved as your permanent Gallery DP.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
                    Click a photo to set as Gallery DP:
                  </label>
                  {photos.length === 0 ? (
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      No gallery photos available. Please switch to "Upload New File".
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
                      {photos.map((pt) => {
                        const isSelected = selectedExistingPhotoUrl === pt.photo_url;
                        return (
                          <div
                            key={pt.id}
                            style={{
                              position: 'relative',
                              height: '80px',
                              borderRadius: 'var(--radius-md)',
                              overflow: 'hidden',
                              border: isSelected ? '3px solid #34d399' : '1px solid var(--border-subtle)',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedExistingPhotoUrl(pt.photo_url)}
                          >
                            <img src={pt.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {isSelected && (
                              <div style={{ position: 'absolute', top: '4px', right: '4px', background: '#34d399', color: '#000', borderRadius: '50%', padding: '2px' }}>
                                <CheckCircle2 size={14} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setIsDpModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveGalleryDp}
                disabled={dpUploading}
              >
                {dpUploading ? 'Saving...' : 'Set Gallery DP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Photos Modal */}
      {isAddOpen && (
        <div className="modal-backdrop no-print" onClick={() => setIsAddOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Photos to Gallery</h2>
              <button className="btn-icon" onClick={() => setIsAddOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Related Program</label>
                  <select
                    className="form-control"
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                  >
                    <option value="">General STIC Club Visual (No Program)</option>
                    {(allPrograms || []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.program_code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Photo Files</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="form-control"
                    onChange={(e) => setPhotoFiles(e.target.files)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Or Image URL</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://images.unsplash.com/..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Caption / Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Prototype demonstration at Tech Fair 2026"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Upload to Gallery</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div className="modal-backdrop no-print" onClick={() => setLightboxPhoto(null)}>
          <div style={{ maxWidth: '85vw', maxHeight: '85vh', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <img src={lightboxPhoto.photo_url} alt="" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', objectFit: 'contain' }} />
            <div style={{ color: '#fff', textAlign: 'center', marginTop: '10px', fontSize: '0.9rem' }}>
              <div style={{ fontWeight: 600 }}>{lightboxPhoto.caption}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                {lightboxPhoto.program_name || 'STIC Visual Archive'} · Uploaded by @{lightboxPhoto.uploaded_by || 'admin'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
