import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  Image,
  Video,
  FileText,
  IndianRupee,
  UserCheck,
  Plus,
  Trash2,
  Download,
  Printer,
  Edit2,
  ExternalLink,
  Play,
  X,
  Share2,
  Sparkles,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import { api } from '../api';

export default function ProgramDetailView({ programId, onBack, showToast, allMembers, onFinanceChange }) {
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'photos', 'videos', 'documents', 'finance', 'team'

  // Modals inside Program
  const [isAddPhotoOpen, setIsAddPhotoOpen] = useState(false);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [isAddTxnOpen, setIsAddTxnOpen] = useState(false);
  const [isAddCoordOpen, setIsAddCoordOpen] = useState(false);

  // Form states
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoUrl, setPhotoUrl] = useState('');

  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Report');
  const [docDesc, setDocDesc] = useState('');
  const [docFile, setDocFile] = useState(null);

  const [txnType, setTxnType] = useState('Income');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnCategory, setTxnCategory] = useState('Registration');
  const [txnDesc, setTxnDesc] = useState('');
  const [txnVendor, setTxnVendor] = useState('');
  const [txnDate, setTxnDate] = useState(new Date().toISOString().split('T')[0]);
  const [txnMethod, setTxnMethod] = useState('UPI');
  const [txnReceiptFile, setTxnReceiptFile] = useState(null);

  const [coordMemberId, setCoordMemberId] = useState('');
  const [coordRole, setCoordRole] = useState('Event Coordinator');

  // Preview Lightbox
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  useEffect(() => {
    if (programId) {
      loadProgram();
    }
  }, [programId]);

  const loadProgram = async () => {
    try {
      setLoading(true);
      const res = await api.getProgram(programId);
      setProgram(res.data);
    } catch (err) {
      showToast('error', 'Error loading program details', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val) => '₹' + Number(val || 0).toLocaleString('en-IN');

  // Upload Photos
  const handleUploadPhotos = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('program_id', programId);
      if (photoCaption) data.append('caption', photoCaption);
      if (photoUrl) data.append('photo_url', photoUrl);
      if (photoFiles && photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i++) {
          data.append('photo', photoFiles[i]);
        }
      }

      await api.uploadPhotos(data);
      showToast('success', 'Photos Added', 'Photographs uploaded to program gallery.');
      setIsAddPhotoOpen(false);
      setPhotoCaption('');
      setPhotoFiles([]);
      setPhotoUrl('');
      loadProgram();
    } catch (err) {
      showToast('error', 'Photo Upload Failed', err.message);
    }
  };

  // Delete Photo
  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete this photo from the program?')) return;
    try {
      await api.deletePhoto(photoId);
      showToast('success', 'Photo Deleted', 'Photograph removed.');
      loadProgram();
    } catch (err) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  // Add Video
  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!videoTitle || !videoUrl) {
      showToast('error', 'Validation Error', 'Title and Video URL are required.');
      return;
    }
    try {
      await api.createVideo({
        program_id: programId,
        title: videoTitle,
        description: videoDesc,
        video_url: videoUrl
      });
      showToast('success', 'Video Added', 'Video linked to program.');
      setIsAddVideoOpen(false);
      setVideoTitle('');
      setVideoDesc('');
      setVideoUrl('');
      loadProgram();
    } catch (err) {
      showToast('error', 'Failed to add video', err.message);
    }
  };

  // Delete Video
  const handleDeleteVideo = async (vidId) => {
    if (!window.confirm('Delete this video?')) return;
    try {
      await api.deleteVideo(vidId);
      showToast('success', 'Video Deleted', 'Video removed.');
      loadProgram();
    } catch (err) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  // Upload Document
  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docTitle || !docFile) {
      showToast('error', 'Validation Error', 'Title and Document file are required.');
      return;
    }
    try {
      const data = new FormData();
      data.append('program_id', programId);
      data.append('title', docTitle);
      data.append('category', docCategory);
      data.append('description', docDesc);
      data.append('file', docFile);

      await api.uploadDocument(data);
      showToast('success', 'Document Uploaded', 'Document added to program archives.');
      setIsAddDocOpen(false);
      setDocTitle('');
      setDocDesc('');
      setDocFile(null);
      loadProgram();
    } catch (err) {
      showToast('error', 'Upload Failed', err.message);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.deleteDocument(docId);
      showToast('success', 'Document Deleted', 'Document removed.');
      loadProgram();
    } catch (err) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  // Add Transaction
  const handleAddTxn = async (e) => {
    e.preventDefault();
    if (!txnAmount || !txnCategory || !txnDate) {
      showToast('error', 'Validation Error', 'Amount, category, and date are required.');
      return;
    }
    try {
      const data = new FormData();
      data.append('program_id', programId);
      data.append('type', txnType);
      data.append('amount', txnAmount);
      data.append('category', txnCategory);
      data.append('description', txnDesc);
      data.append('source_vendor', txnVendor);
      data.append('date', txnDate);
      data.append('payment_method', txnMethod);
      if (txnReceiptFile) {
        data.append('receipt', txnReceiptFile);
      }

      await api.createTransaction(data);
      showToast('success', 'Transaction Recorded', `${txnType} of ${formatINR(txnAmount)} added to program balance.`);
      setIsAddTxnOpen(false);
      setTxnAmount('');
      setTxnDesc('');
      setTxnVendor('');
      setTxnReceiptFile(null);
      await loadProgram();
      if (onFinanceChange) onFinanceChange();
    } catch (err) {
      showToast('error', 'Failed to add transaction', err.message);
    }
  };

  // Delete Transaction
  const handleDeleteTxn = async (txnId) => {
    if (!window.confirm('Delete this transaction from this program?')) return;
    try {
      await api.deleteTransaction(txnId);
      showToast('success', 'Transaction Deleted', 'Transaction removed and program balance updated.');
      await loadProgram();
      if (onFinanceChange) onFinanceChange();
    } catch (err) {
      showToast('error', 'Failed to delete transaction', err.message);
    }
  };

  // Add Coordinator
  const handleAddCoordinator = async (e) => {
    e.preventDefault();
    if (!coordMemberId) {
      showToast('error', 'Select Member', 'Please select a club member.');
      return;
    }
    try {
      await api.addCoordinator(programId, {
        member_id: coordMemberId,
        role_title: coordRole
      });
      showToast('success', 'Coordinator Assigned', 'Member appointed as program coordinator.');
      setIsAddCoordOpen(false);
      setCoordMemberId('');
      loadProgram();
    } catch (err) {
      showToast('error', 'Assignment Failed', err.message);
    }
  };

  // Remove Coordinator
  const handleRemoveCoordinator = async (memberId) => {
    if (!window.confirm('Remove this coordinator from the program?')) return;
    try {
      await api.removeCoordinator(programId, memberId);
      showToast('success', 'Coordinator Removed', 'Member unassigned as coordinator.');
      loadProgram();
    } catch (err) {
      showToast('error', 'Removal Failed', err.message);
    }
  };

  if (loading || !program) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '12px' }}>Loading program record...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Back button & Program Header */}
      <div style={{ marginBottom: '18px' }} className="no-print">
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={15} /> Back to Programs List
        </button>
      </div>

      {/* Program Hero Card */}
      <div className="stic-card" style={{ marginBottom: '22px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {program.poster_url && (
              <div style={{ width: '160px', height: '160px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-subtle)', background: '#0a0f18' }}>
                <img src={program.poster_url} alt={program.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-light)', fontFamily: 'monospace' }}>
                  {program.program_code}
                </span>
                <span className="badge badge-info">{program.program_type}</span>
                <span className="badge badge-success">{program.status}</span>
              </div>

              <h1 style={{ fontSize: '1.75rem', marginBottom: '8px', lineHeight: 1.3 }}>
                {program.name}
              </h1>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CalendarDays size={16} color="var(--primary-light)" />
                  <span>{program.program_date} {program.start_time ? `(${program.start_time} - ${program.end_time || ''})` : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="var(--accent-cyan)" />
                  <span>{program.venue}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} color="#fbbf24" />
                  <span>{program.participants_count} Registered Participants</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', marginLeft: 'auto' }} className="no-print">
              <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                <Printer size={15} /> Print Financial Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="tab-container no-print">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <CalendarDays size={16} /> 1. Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          <Image size={16} /> 2. Photos ({program.photos?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <Video size={16} /> 3. Videos ({program.videos?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <FileText size={16} /> 4. Content & Docs ({program.documents?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
          onClick={() => setActiveTab('finance')}
        >
          <IndianRupee size={16} /> 5. Finance ({formatINR(program.finance?.balance)})
        </button>
        <button
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <UserCheck size={16} /> 6. Team / Coordinators ({program.coordinators?.length || 0})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
          <div className="stic-card" style={{ marginBottom: 0 }}>
            <div className="card-header-bar">
              <h3>Program Objectives & Details</h3>
            </div>
            <div className="card-body">
              <p style={{ lineHeight: 1.7, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                {program.description || 'No detailed description specified for this event.'}
              </p>
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem' }}>
                <div><strong style={{ color: 'var(--text-subtle)' }}>Code:</strong> {program.program_code}</div>
                <div><strong style={{ color: 'var(--text-subtle)' }}>Schedule:</strong> {program.program_date} from {program.start_time || 'N/A'} to {program.end_time || 'N/A'}</div>
                <div><strong style={{ color: 'var(--text-subtle)' }}>Location:</strong> {program.venue}</div>
                <div><strong style={{ color: 'var(--text-subtle)' }}>Status:</strong> {program.status}</div>
              </div>
            </div>
          </div>

          <div className="stic-card" style={{ marginBottom: 0 }}>
            <div className="card-header-bar">
              <h3>Financial Balance Snapshot</h3>
              <span className="badge badge-success">Automated Ledger</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Money Collected:</span>
                  <strong style={{ color: '#34d399', fontSize: '1.05rem' }}>{formatINR(program.finance?.total_income)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Money Spent:</span>
                  <strong style={{ color: '#fb7185', fontSize: '1.05rem' }}>{formatINR(program.finance?.total_expense)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-highlight)' }}>
                  <span style={{ fontWeight: 700 }}>Program Remaining Balance:</span>
                  <strong style={{ fontSize: '1.25rem', color: program.finance?.balance >= 0 ? '#34d399' : '#fb7185' }}>
                    {formatINR(program.finance?.balance)}
                  </strong>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('finance')} style={{ marginTop: '6px' }}>
                  Open Detailed Financial Statement →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHOTOS */}
      {activeTab === 'photos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }} className="no-print">
            <h3 style={{ fontSize: '1.15rem' }}>Photos for {program.name}</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddPhotoOpen(true)}>
              <Plus size={15} /> Upload Photos
            </button>
          </div>

          {program.photos && program.photos.length > 0 ? (
            <div className="photo-gallery-grid">
              {program.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="photo-gallery-item"
                  style={{
                    width: '280px',
                    height: '280px',
                    minWidth: '280px',
                    minHeight: '280px',
                    aspectRatio: '1 / 1',
                    borderRadius: '50%'
                  }}
                  onClick={() => setPreviewPhoto(photo)}
                >
                  <img src={photo.photo_url} alt={photo.caption || 'Program Photo'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  <div className="photo-caption-bar">
                    <div>{photo.caption || 'STIC Program Photograph'}</div>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '2px 6px', marginTop: '6px', fontSize: '0.7rem' }}
                      onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="stic-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
              No photos added to this program yet. Click "+ Upload Photos" to add event pictures.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VIDEOS */}
      {activeTab === 'videos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }} className="no-print">
            <h3 style={{ fontSize: '1.15rem' }}>Videos for {program.name}</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddVideoOpen(true)}>
              <Plus size={15} /> + Add Video
            </button>
          </div>

          {program.videos && program.videos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              {program.videos.map((vid) => (
                <div key={vid.id} className="stic-card" style={{ marginBottom: 0 }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <Video size={20} color="var(--primary-light)" />
                      <h4 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{vid.title}</h4>
                    </div>
                    {vid.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        {vid.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={vid.video_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1 }}
                      >
                        <Play size={13} /> Play / Open Video <ExternalLink size={12} />
                      </a>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteVideo(vid.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="stic-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
              No videos linked to this event. Click "+ Add Video" to link YouTube/Drive recordings.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CONTENT & DOCUMENTATION */}
      {activeTab === 'documents' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }} className="no-print">
            <h3 style={{ fontSize: '1.15rem' }}>Content & Documentation for {program.name}</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddDocOpen(true)}>
              <Plus size={15} /> Upload Document
            </button>
          </div>

          {program.documents && program.documents.length > 0 ? (
            <div className="table-responsive stic-card" style={{ padding: 0 }}>
              <table className="stic-table">
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Category</th>
                    <th>File</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {program.documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{doc.title}</div>
                        {doc.description && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>{doc.description}</div>
                        )}
                      </td>
                      <td><span className="badge badge-info">{doc.category}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {doc.file_name} ({Math.round((doc.file_size || 0) / 1024)} KB)
                      </td>
                      <td>{doc.uploaded_by || 'Admin'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{doc.created_at ? doc.created_at.split(' ')[0] : 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a
                            href={doc.file_url}
                            download={doc.file_name}
                            className="btn btn-secondary btn-sm"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download size={13} /> Download
                          </a>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteDoc(doc.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="stic-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
              No documents or reports uploaded for this program yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: FINANCE (MONEY COLLECTED, MONEY SPENT, REMAINING BALANCE) */}
      {activeTab === 'finance' && (
        <div>
          {/* Printable Statement Header */}
          <div style={{ display: 'none' }} className="print-only">
            <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>STIC – Sustainable Technology and Innovation Club</h2>
            <h3 style={{ textAlign: 'center', color: '#059669', marginBottom: '20px' }}>
              OFFICIAL FINANCIAL AUDIT REPORT: {program.name} ({program.program_code})
            </h3>
            <p style={{ textAlign: 'center', marginBottom: '24px' }}>
              Date: {program.program_date} | Venue: {program.venue} | Generated on {new Date().toLocaleDateString()}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }} className="no-print">
            <h3 style={{ fontSize: '1.15rem' }}>Financial Accounts: {program.name}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                <Printer size={15} /> Print Invoice / Report
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setIsAddTxnOpen(true)}>
                <Plus size={15} /> + Add Income / Expense
              </button>
            </div>
          </div>

          {/* 3 Summary Badges */}
          <div className="kpi-grid" style={{ marginBottom: '22px' }}>
            <div className="kpi-card">
              <div className="kpi-icon-wrap kpi-icon-emerald"><IndianRupee size={22} /></div>
              <div className="kpi-info">
                <div className="kpi-label">Money Collected</div>
                <div className="kpi-value" style={{ color: '#34d399' }}>{formatINR(program.finance?.total_income)}</div>
                <div className="kpi-subtext">Registration + Sponsorship + Other</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon-wrap kpi-icon-rose"><IndianRupee size={22} /></div>
              <div className="kpi-info">
                <div className="kpi-label">Money Spent</div>
                <div className="kpi-value" style={{ color: '#fb7185' }}>{formatINR(program.finance?.total_expense)}</div>
                <div className="kpi-subtext">Food, Printing, Logistics, Decor</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon-wrap kpi-icon-amber"><IndianRupee size={22} /></div>
              <div className="kpi-info">
                <div className="kpi-label">Program Balance</div>
                <div className="kpi-value" style={{ color: program.finance?.balance >= 0 ? '#34d399' : '#fb7185' }}>
                  {formatINR(program.finance?.balance)}
                </div>
                <div className="kpi-subtext">Formula: Total Collected - Total Spent</div>
              </div>
            </div>
          </div>

          {/* Two Tables: Money Collected vs Money Spent */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '22px' }}>
            {/* Money Collected Table */}
            <div className="stic-card" style={{ marginBottom: 0 }}>
              <div className="card-header-bar">
                <h3 style={{ color: '#34d399' }}>
                  <CheckCircle size={18} /> MONEY COLLECTED ({formatINR(program.finance?.total_income)})
                </h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {program.finance?.income_list && program.finance.income_list.length > 0 ? (
                  <div className="table-responsive">
                    <table className="stic-table">
                      <thead>
                        <tr>
                          <th>Source / Category</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th className="no-print">Receipt</th>
                          <th className="no-print">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {program.finance.income_list.map((txn) => (
                          <tr key={txn.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{txn.source_vendor || txn.category}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                                {txn.description} · via {txn.payment_method}
                              </div>
                            </td>
                            <td style={{ fontWeight: 700, color: '#34d399' }}>{formatINR(txn.amount)}</td>
                            <td style={{ fontSize: '0.8rem' }}>{txn.date}</td>
                            <td className="no-print">
                              {txn.receipt_url ? (
                                <a href={txn.receipt_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem' }}>
                                  View Doc
                                </a>
                              ) : <span style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>None</span>}
                            </td>
                            <td className="no-print">
                              <button className="btn-icon" onClick={() => handleDeleteTxn(txn.id)} title="Delete">
                                <Trash2 size={13} style={{ color: '#fb7185' }} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-subtle)' }}>
                    No collections recorded for this program yet.
                  </div>
                )}
              </div>
            </div>

            {/* Money Spent Table */}
            <div className="stic-card" style={{ marginBottom: 0 }}>
              <div className="card-header-bar">
                <h3 style={{ color: '#fb7185' }}>
                  <IndianRupee size={18} /> MONEY SPENT ({formatINR(program.finance?.total_expense)})
                </h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {program.finance?.expense_list && program.finance.expense_list.length > 0 ? (
                  <div className="table-responsive">
                    <table className="stic-table">
                      <thead>
                        <tr>
                          <th>Expense / Category</th>
                          <th>Amount</th>
                          <th>Date</th>
                          <th className="no-print">Receipt</th>
                          <th className="no-print">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {program.finance.expense_list.map((txn) => (
                          <tr key={txn.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{txn.category}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                                {txn.description} {txn.source_vendor ? `· ${txn.source_vendor}` : ''}
                              </div>
                            </td>
                            <td style={{ fontWeight: 700, color: '#fb7185' }}>{formatINR(txn.amount)}</td>
                            <td style={{ fontSize: '0.8rem' }}>{txn.date}</td>
                            <td className="no-print">
                              {txn.receipt_url ? (
                                <a href={txn.receipt_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem' }}>
                                  View Doc
                                </a>
                              ) : <span style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>None</span>}
                            </td>
                            <td className="no-print">
                              <button className="btn-icon" onClick={() => handleDeleteTxn(txn.id)} title="Delete">
                                <Trash2 size={13} style={{ color: '#fb7185' }} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-subtle)' }}>
                    No expenses recorded for this program yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: TEAM / COORDINATORS */}
      {activeTab === 'team' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }} className="no-print">
            <h3 style={{ fontSize: '1.15rem' }}>Organizing Committee & Coordinators</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddCoordOpen(true)}>
              <Plus size={15} /> + Appoint Coordinator
            </button>
          </div>

          {program.coordinators && program.coordinators.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {program.coordinators.map((coord) => (
                <div key={coord.id} className="stic-card" style={{ marginBottom: 0 }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '60px', height: '60px', minWidth: '60px', minHeight: '60px', aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '2.5px solid var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary-light)', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                        {coord.profile_photo ? (
                          <img src={coord.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : coord.full_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{coord.full_name}</div>
                        <span className="badge badge-info" style={{ marginTop: '2px' }}>{coord.role_title || 'Coordinator'}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><strong>ID:</strong> {coord.college_id}</div>
                      <div><strong>Year:</strong> {coord.year} ({coord.branch})</div>
                      <div><strong>Email:</strong> {coord.email}</div>
                    </div>

                    <div style={{ marginTop: '12px', textAlign: 'right' }} className="no-print">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveCoordinator(coord.id)}
                      >
                        <Trash2 size={13} /> Remove Coordinator
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="stic-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
              No coordinators assigned to this event yet.
            </div>
          )}
        </div>
      )}

      {/* Modal: Upload Photos */}
      {isAddPhotoOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Upload Photographs for {program.name}</h3>
              <button className="btn-icon" onClick={() => setIsAddPhotoOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleUploadPhotos}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Select Photo Files (Up to 10 photos)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => setPhotoFiles(e.target.files)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Or External Photo URL</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://example.com/photo.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Caption / Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Keynote address and student prototype display"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddPhotoOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Upload Photos</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Video */}
      {isAddVideoOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Add Video Recording</h3>
              <button className="btn-icon" onClick={() => setIsAddVideoOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddVideo}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Video Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. STIC Workshop Recap & Keynote"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Video Link (YouTube, Google Drive, Vimeo, MP4 URL) *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Video Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Overview of highlights, time codes, speakers..."
                    value={videoDesc}
                    onChange={(e) => setVideoDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddVideoOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Video</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Document */}
      {isAddDocOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Upload Document / Report</h3>
              <button className="btn-icon" onClick={() => setIsAddDocOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleUploadDoc}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Document Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. STIC Workshop Comprehensive Report 2026"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                  >
                    <option value="Report">Report</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Poster">Poster</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Press Release">Press Release</option>
                    <option value="Event Write-up">Event Write-up</option>
                    <option value="Meeting Notes">Meeting Notes</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Select File (PDF, DOCX, PPTX, Images) *</label>
                  <input
                    type="file"
                    className="form-input"
                    required
                    onChange={(e) => setDocFile(e.target.files[0] || null)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description / Summary</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Brief outline of document contents..."
                    value={docDesc}
                    onChange={(e) => setDocDesc(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddDocOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Upload Document</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Financial Transaction */}
      {isAddTxnOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Record Program Transaction</h3>
              <button className="btn-icon" onClick={() => setIsAddTxnOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddTxn}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Transaction Type *</label>
                    <select
                      className="form-select"
                      value={txnType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setTxnType(newType);
                        setTxnCategory(newType === 'Income' ? 'Registration' : 'Food');
                      }}
                    >
                      <option value="Income">Income (Money Collected)</option>
                      <option value="Expense">Expense (Money Spent)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount (₹ INR) *</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      required
                      placeholder="e.g. 5000"
                      value={txnAmount}
                      onChange={(e) => setTxnAmount(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={txnCategory}
                      onChange={(e) => setTxnCategory(e.target.value)}
                    >
                      {txnType === 'Income' ? (
                        <>
                          <option value="Registration">Registration</option>
                          <option value="Sponsorship">Sponsorship</option>
                          <option value="Donations">Donations</option>
                          <option value="Club contribution">Club contribution</option>
                          <option value="Other">Other</option>
                        </>
                      ) : (
                        <>
                          <option value="Food">Food</option>
                          <option value="Printing">Printing</option>
                          <option value="Certificates">Certificates</option>
                          <option value="Decoration">Decoration</option>
                          <option value="Transportation">Transportation</option>
                          <option value="Equipment">Equipment</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Venue">Venue</option>
                          <option value="Refreshments">Refreshments</option>
                          <option value="Other">Other</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={txnDate}
                      onChange={(e) => setTxnDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Source / Vendor / Beneficiary</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. GreenPrint Press, Campus Canteen..."
                      value={txnVendor}
                      onChange={(e) => setTxnVendor(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
                      value={txnMethod}
                      onChange={(e) => setTxnMethod(e.target.value)}
                    >
                      <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online">Online Gateway</option>
                    </select>
                  </div>

                  <div className="form-group form-full">
                    <label className="form-label">Invoice / Receipt Upload</label>
                    <input
                      type="file"
                      className="form-input"
                      onChange={(e) => setTxnReceiptFile(e.target.files[0] || null)}
                    />
                  </div>

                  <div className="form-group form-full">
                    <label className="form-label">Transaction Description</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Details of goods, services, or registration lots"
                      value={txnDesc}
                      onChange={(e) => setTxnDesc(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddTxnOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Appoint Coordinator */}
      {isAddCoordOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Appoint Program Coordinator</h3>
              <button className="btn-icon" onClick={() => setIsAddCoordOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddCoordinator}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Select Club Member *</label>
                  <select
                    className="form-select"
                    required
                    value={coordMemberId}
                    onChange={(e) => setCoordMemberId(e.target.value)}
                  >
                    <option value="">-- Choose Member --</option>
                    {(allMembers || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.college_id} - {m.department_name || 'No Dept'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Coordinator Role Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Lead Coordinator, Stage Manager, Logistics Head"
                    value={coordRole}
                    onChange={(e) => setCoordRole(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddCoordOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Appoint Coordinator</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {previewPhoto && (
        <div className="modal-overlay" onClick={() => setPreviewPhoto(null)}>
          <div style={{ maxWidth: '85vw', maxHeight: '85vh', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <img src={previewPhoto.photo_url} alt="" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', objectFit: 'contain' }} />
            <div style={{ color: '#fff', textAlign: 'center', marginTop: '10px', fontSize: '0.9rem' }}>
              {previewPhoto.caption}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
