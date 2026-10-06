import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Share2,
  Edit3,
  Trash2,
  Copy,
  Check,
  Eye,
  Sparkles,
  X,
  Upload,
  Download,
  FileCode,
  RefreshCw,
  CheckCircle2,
  File,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';

export default function DocumentsView({ showToast }) {
  // Custom Uploaded Templates state
  const [customTemplates, setCustomTemplates] = useState([]);
  const [customLoading, setCustomLoading] = useState(false);

  // Active Tab: 'custom' (My Templates Library), 'use-custom' (Paste Matter & Generate)
  const [activeTab, setActiveTab] = useState('custom');

  // Currently selected custom template
  const [selectedCustomTemplate, setSelectedCustomTemplate] = useState(null);
  const [pastedMatter, setPastedMatter] = useState('');

  // Generation & Result state
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);

  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'Custom Template',
    file: null
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const matterRef = useRef(null);

  // Fetch custom templates on load
  useEffect(() => {
    fetchCustomTemplates();
  }, []);

  const fetchCustomTemplates = async (selectId = null) => {
    try {
      setCustomLoading(true);
      const res = await api.getCustomTemplates();
      const list = res.data || [];
      setCustomTemplates(list);

      if (selectId) {
        const found = list.find((t) => t.id === selectId);
        if (found) handleUseTemplate(found);
      }
    } catch (err) {
      showToast('error', 'Error loading templates', err.message);
    } finally {
      setCustomLoading(false);
    }
  };

  // Select a template to use
  const handleUseTemplate = (tpl) => {
    setSelectedCustomTemplate(tpl);
    setGeneratedResult(null);
    setActiveTab('use-custom');
  };

  // Upload file selection
  const handleUploadFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['docx', 'pptx', 'pdf'].includes(ext)) {
      showToast('error', 'Unsupported Format', 'Please upload a DOCX, PPTX, or PDF template file.');
      return;
    }

    const defaultName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/_/g, ' ');
    setUploadForm((prev) => ({
      ...prev,
      file,
      name: prev.name || defaultName
    }));
  };

  // Upload submit
  const handleUploadCustomTemplateSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      showToast('error', 'File Required', 'Please choose a DOCX, PPTX, or PDF template file from your computer.');
      return;
    }
    if (!uploadForm.name.trim()) {
      showToast('error', 'Name Required', 'Please provide a name for your template.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('name', uploadForm.name.trim());
      formData.append('description', uploadForm.description || '');
      formData.append('category', uploadForm.category || 'Custom Template');

      const res = await api.uploadCustomTemplate(formData);
      showToast('success', 'Template Added!', `"${uploadForm.name}" was added to your Template Library.`);
      setIsUploadModalOpen(false);
      setUploadForm({ name: '', description: '', category: 'Custom Template', file: null });

      await fetchCustomTemplates(res.data?.id);
    } catch (err) {
      showToast('error', 'Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete Template
  const handleDeleteCustomTemplate = async (tpl) => {
    if (!window.confirm(`Are you sure you want to delete template "${tpl.name}"?`)) {
      return;
    }
    try {
      await api.deleteCustomTemplate(tpl.id);
      showToast('success', 'Template Deleted', `"${tpl.name}" was removed.`);
      if (selectedCustomTemplate?.id === tpl.id) {
        setSelectedCustomTemplate(null);
        setActiveTab('custom');
      }
      fetchCustomTemplates();
    } catch (err) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  // Generate Document from pasted matter
  const handleGenerateDocument = async () => {
    if (!selectedCustomTemplate) {
      showToast('error', 'No Template Selected', 'Please select a template first.');
      return;
    }
    if (!pastedMatter.trim()) {
      showToast('error', 'Matter Required', 'Please paste your text/matter in the box before generating.');
      return;
    }

    try {
      setGenerating(true);
      const payload = {
        freeform_matter: pastedMatter,
        title: `${selectedCustomTemplate.name} - Generated`
      };

      const res = await api.generateFromCustomTemplate(selectedCustomTemplate.id, payload);
      setGeneratedResult(res.data);
      showToast('success', 'Document Generated!', 'Your document has been styled and formatted according to your template.');
    } catch (err) {
      showToast('error', 'Generation Error', err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Direct Browser Download
  const triggerDownload = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url || generatedResult?.download_url;
    link.download = fileName || generatedResult?.file_name || 'Generated_Document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Downloading File', `Downloading ${fileName || 'document'}...`);
  };

  // Action Handlers
  const handleEditMatter = () => {
    if (matterRef.current) {
      matterRef.current.focus();
      matterRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePrintDocument = () => {
    window.print();
  };

  const handleShareDocument = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedCustomTemplate?.name || 'Generated Document',
          text: pastedMatter
        });
        showToast('success', 'Shared', 'Document shared successfully.');
        return;
      } catch (e) {
        if (e.name !== 'AbortError') setIsShareModalOpen(true);
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  const handleCopyMatterText = () => {
    navigator.clipboard.writeText(pastedMatter);
    setCopied(true);
    showToast('success', 'Copied', 'Pasted matter copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
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
              <FileText size={24} />
            </div>
            <div>
              <h1>CONTENT &amp; DOCUMENTATION</h1>
              <p>Custom Template Generator · Upload template, paste your matter, and generate formatted documents</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
            <Plus size={18} />
            <span>+ Add Template</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="no-print" style={{ marginBottom: '22px' }}>
        <div className="tab-container" style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            <FileCode size={16} />
            <span>My Templates ({customTemplates.length})</span>
          </button>

          {selectedCustomTemplate && (
            <button
              className={`tab-btn ${activeTab === 'use-custom' ? 'active' : ''}`}
              onClick={() => setActiveTab('use-custom')}
            >
              <Sparkles size={16} />
              <span>Use: {selectedCustomTemplate.name}</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. MY TEMPLATES LIBRARY                                       */}
      {/* ============================================================ */}
      {activeTab === 'custom' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                My Templates
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                Upload your custom DOCX, PPTX, or PDF template files to format your document text automatically.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setIsUploadModalOpen(true)}>
              <Plus size={15} />
              <span>+ Add Template</span>
            </button>
          </div>

          {customLoading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading template library...
            </div>
          ) : customTemplates.length === 0 ? (
            <div className="empty-state" style={{ background: 'var(--bg-surface)', border: '2px dashed var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '48px 20px', textAlign: 'center' }}>
              <Upload size={48} className="empty-icon" style={{ color: '#34d399', margin: '0 auto 12px' }} />
              <h3 style={{ color: 'var(--text-main)', marginBottom: '6px' }}>No Custom Templates Uploaded</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 18px', fontSize: '0.88rem' }}>
                Upload your DOCX, PPTX, or PDF document template file to start auto-generating formatted reports, notices, and letters.
              </p>
              <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
                <Plus size={16} />
                <span>+ Add Template</span>
              </button>
            </div>
          ) : (
            <div className="template-card-grid">
              {customTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="template-item-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '20px',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                >
                  <div>
                    {/* File Type Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className={`badge ${tpl.file_type === 'docx' ? 'badge-info' : tpl.file_type === 'pptx' ? 'badge-warning' : 'badge-emerald'}`} style={{ fontWeight: 700 }}>
                        {(tpl.file_type || 'DOCX').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {(tpl.file_size ? (tpl.file_size / 1024).toFixed(1) : '0')} KB
                      </span>
                    </div>

                    {/* Template Name */}
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                      "{tpl.name}"
                    </h3>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      File: {tpl.original_filename}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => handleUseTemplate(tpl)}
                    >
                      <Eye size={14} />
                      <span>Preview</span>
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => handleUseTemplate(tpl)}
                    >
                      <Sparkles size={14} />
                      <span>Use Template</span>
                    </button>
                    <button
                      className="btn btn-outline btn-sm btn-icon"
                      onClick={() => handleDeleteCustomTemplate(tpl)}
                      title="Delete Template"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. PASTE MY MATTER & GENERATE DOCUMENT                        */}
      {/* ============================================================ */}
      {activeTab === 'use-custom' && selectedCustomTemplate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active Template Banner */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-highlight)',
              borderRadius: 'var(--radius-xl)',
              padding: '16px 24px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setActiveTab('custom')}
                title="Back to Template Library"
              >
                <ArrowLeft size={16} />
                <span>My Templates</span>
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-emerald">Active Template</span>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    "{selectedCustomTemplate.name}"
                  </h2>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Format: {(selectedCustomTemplate.file_type || 'docx').toUpperCase()} · Template design, fonts, colors &amp; logos strictly preserved.
                </span>
              </div>
            </div>

            <button
              className="btn btn-outline btn-sm"
              onClick={() => setActiveTab('custom')}
            >
              Change Template
            </button>
          </div>

          {/* Generator Layout */}
          <div className="template-generator-grid">
            {/* LEFT SIDE: Paste Matter Area */}
            <div className="template-editor-card no-print">
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  2. Paste Your Matter
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Copy your report, meeting notes, notice, or document text and paste it into the box below.
                </p>
              </div>

              {/* Large Single Text Area */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.92rem', fontWeight: 700, color: '#34d399' }}>
                  Paste Your Matter Here:
                </label>
                <textarea
                  ref={matterRef}
                  className="matter-textarea"
                  rows={14}
                  style={{
                    width: '100%',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    resize: 'vertical'
                  }}
                  value={pastedMatter}
                  onChange={(e) => setPastedMatter(e.target.value)}
                  placeholder="Paste your complete document matter, report, article, meeting notes, or notice here...

Example:
STIC EVENT REPORT
Date: 25 September 2026
Venue: SRIT Auditorium

The Sustainable Technology & Innovation Club successfully organized a technical workshop..."
                />
              </div>

              {/* Generate Button */}
              <button
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  justifyContent: 'center',
                  marginTop: '12px'
                }}
                onClick={handleGenerateDocument}
                disabled={generating}
              >
                {generating ? (
                  <span>Generating Document...</span>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Generate Document</span>
                  </>
                )}
              </button>
            </div>

            {/* RIGHT SIDE: Generated View & Action Controls */}
            <div>
              <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={16} color="#34d399" />
                  <span>3. Document Output &amp; Actions</span>
                </span>
              </div>

              {generatedResult ? (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-highlight)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
                  {/* Status Banner */}
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <CheckCircle2 size={42} color="#34d399" style={{ margin: '0 auto 10px' }} />
                    <h3 style={{ color: 'var(--text-main)', fontWeight: 800, marginBottom: '4px' }}>
                      Document Generated Successfully!
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                      File: <strong>{generatedResult.file_name}</strong> ({(generatedResult.file_size / 1024).toFixed(1)} KB)
                    </p>
                  </div>

                  {/* 5 Action Buttons Required by User */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {/* Primary Download */}
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '14px', justifyContent: 'center', fontWeight: 800 }}
                      onClick={() => triggerDownload(generatedResult.download_url, generatedResult.file_name)}
                    >
                      <Download size={18} />
                      <span>Download Document ({(selectedCustomTemplate.file_type || 'DOCX').toUpperCase()})</span>
                    </button>

                    {/* Action Grid: Edit Matter, Regenerate, Share, Print */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button className="btn btn-outline" onClick={handleEditMatter} title="Edit pasted matter and regenerate">
                        <Edit3 size={16} />
                        <span>Edit Matter</span>
                      </button>

                      <button className="btn btn-outline" onClick={handleGenerateDocument} disabled={generating} title="Re-run document generation">
                        <RefreshCw size={16} className={generating ? 'spin' : ''} />
                        <span>Regenerate</span>
                      </button>

                      <button className="btn btn-outline" onClick={handleShareDocument} title="Share document link or text">
                        <Share2 size={16} />
                        <span>Share</span>
                      </button>

                      <button className="btn btn-outline" onClick={handlePrintDocument} title="Print document">
                        <Printer size={16} />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Text Preview Box */}
                  <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Pasted Matter Preview
                      </span>
                      <button className="btn btn-link btn-sm" onClick={handleCopyMatterText} style={{ fontSize: '0.78rem', color: '#34d399' }}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? 'Copied' : 'Copy Text'}</span>
                      </button>
                    </div>
                    <div
                      style={{
                        maxHeight: '220px',
                        overflowY: 'auto',
                        fontSize: '0.85rem',
                        lineHeight: 1.6,
                        color: 'var(--text-main)',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace'
                      }}
                    >
                      {pastedMatter}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '48px 24px',
                    textAlign: 'center'
                  }}
                >
                  <FileCode size={48} style={{ color: 'var(--primary-light)', margin: '0 auto 12px' }} />
                  <h4 style={{ color: 'var(--text-main)', fontWeight: 700, marginBottom: '6px' }}>
                    Ready to Generate
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', maxWidth: '340px', margin: '0 auto' }}>
                    Paste your document text on the left and click <strong>Generate Document</strong> to download your styled file.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ============================================================ */}
      {/* MODAL: ADD CUSTOM TEMPLATE FILE UPLOAD                       */}
      {/* ============================================================ */}
      {isUploadModalOpen && (
        <div className="modal-backdrop no-print" onClick={() => setIsUploadModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>+ Add Template</h2>
              <button className="btn-icon" onClick={() => setIsUploadModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadCustomTemplateSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* File Upload Dropzone */}
                <div
                  style={{
                    border: '2px dashed var(--border-highlight)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '28px',
                    textAlign: 'center',
                    background: 'var(--bg-main)',
                    cursor: 'pointer'
                  }}
                  onClick={() => document.getElementById('customTemplateFileInput').click()}
                >
                  <Upload size={38} color="#34d399" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                    {uploadForm.file ? uploadForm.file.name : 'Select or Drop Template File'}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                    Supports <strong>DOCX</strong>, <strong>PPTX</strong>, and <strong>PDF</strong> templates.
                  </p>
                  <input
                    id="customTemplateFileInput"
                    type="file"
                    accept=".docx,.pptx,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleUploadFileSelect}
                  />
                </div>

                {/* Template Name */}
                <div className="form-group">
                  <label className="form-label required">Template Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    placeholder="e.g. STIC Event Report"
                    required
                  />
                </div>

                {/* Optional Description */}
                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="e.g. Club report or event circular template design"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsUploadModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Save to Template Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal Fallback */}
      {isShareModalOpen && (
        <div className="modal-backdrop no-print" onClick={() => setIsShareModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Share Document</h2>
              <button className="btn-icon" onClick={() => setIsShareModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Copy the pasted matter text below to share manually:
              </p>
              <textarea
                className="form-control"
                rows={6}
                readOnly
                value={pastedMatter}
                style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsShareModalOpen(false)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={handleCopyMatterText}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
