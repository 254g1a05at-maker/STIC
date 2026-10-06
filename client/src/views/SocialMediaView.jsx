import React, { useState, useEffect, useCallback } from 'react';
import {
  Share2,
  ExternalLink,
  RefreshCw,
  Clock,
  X,
  Video,
  Image as ImageIcon,
  Sparkles,
  Link2,
  Send,
  MessageCircle,
  PlusCircle,
  Radio,
  Trash2,
  Users,
  Star,
  GitFork,
  Upload,
  Play,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Layers,
  FileText
} from 'lucide-react';
import { api, authState } from '../api';

// Crisp, high-contrast SVG brand icons
const InstagramIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const WhatsAppIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const LinkedInIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GitHubIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

/**
 * Relative time calculation: "Just now", "2m ago", "1h ago", etc.
 */
function formatRelativeTime(dateString) {
  if (!dateString) return 'Never';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Recently';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Recently';
  }
}

/**
 * Format timestamp in Real Indian Standard Time (Asia/Kolkata, UTC+05:30)
 */
function formatISTDate(post) {
  if (!post) return '—';
  if (post.published_at_ist) return post.published_at_ist;
  const dateVal = post.published_at || post.publication_date || post.created_at;
  if (!dateVal) return '—';

  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const formatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const parts = formatter.formatToParts(d);
      const p = {};
      parts.forEach(({ type, value }) => { p[type] = value; });
      const period = (p.dayPeriod || '').toUpperCase();
      return `${p.day}/${p.month}/${p.year}, ${p.hour}:${p.minute} ${period} IST`;
    }
  } catch (e) {}

  return post.publication_date || '—';
}

export default function SocialMediaView({ showToast }) {
  const [loading, setLoading] = useState(true);

  // 1. Instagram State
  const [igInfo, setIgInfo] = useState({
    connected: false,
    url: '',
    username: '',
    account_name: '',
    followers: '',
    following: '',
    avatar_url: '',
    latest_post: null,
    latest_reel: null,
    latest_story: null,
    all_posts: [],
    total_posts: 0,
    last_synced: null
  });
  const [selectedIgPostIndex, setSelectedIgPostIndex] = useState(0);
  const [isIgConnectOpen, setIsIgConnectOpen] = useState(false);
  const [igFormUrl, setIgFormUrl] = useState('');
  const [igFormFollowers, setIgFormFollowers] = useState('');
  const [igFormUsername, setIgFormUsername] = useState('');
  const [isConnectingIg, setIsConnectingIg] = useState(false);

  // Active IG preview tab: 'post' | 'reel' | 'story'
  const [activeIgTab, setActiveIgTab] = useState('post');

  // Instagram Content Creation Modal
  const [isIgPostOpen, setIsIgPostOpen] = useState(false);
  const [igPostType, setIgPostType] = useState('Post'); // 'Post' | 'Reel' | 'Story'
  const [igPostCaption, setIgPostCaption] = useState('');
  const [igPostUrl, setIgPostUrl] = useState('');
  const [igMediaFile, setIgMediaFile] = useState(null);
  const [igMediaPreview, setIgMediaPreview] = useState('');
  const [isSubmittingIg, setIsSubmittingIg] = useState(false);

  // 2. WhatsApp State
  const [waInfo, setWaInfo] = useState({
    connected: false,
    channel_url: '',
    channel_name: '',
    total_members: '',
    community_status: 'Not Connected',
    latest_message: null,
    recent_messages: [],
    last_synced: null
  });
  const [isWaConnectOpen, setIsWaConnectOpen] = useState(false);
  const [waFormUrl, setWaFormUrl] = useState('');
  const [waFormName, setWaFormName] = useState('');
  const [waFormMembers, setWaFormMembers] = useState('');
  const [isConnectingWa, setIsConnectingWa] = useState(false);

  // WhatsApp Broadcast / Message Modal
  const [isWaMessageOpen, setIsWaMessageOpen] = useState(false);
  const [waMessageMode, setWaMessageMode] = useState('message'); // 'message' | 'broadcast'
  const [waMessageText, setWaMessageText] = useState('');
  const [waMediaFile, setWaMediaFile] = useState(null);
  const [waMediaPreview, setWaMediaPreview] = useState('');
  const [isSubmittingWa, setIsSubmittingWa] = useState(false);

  // WhatsApp Recent Messages Timeline Modal
  const [isWaTimelineOpen, setIsWaTimelineOpen] = useState(false);

  // 3. Connected Apps (LinkedIn, GitHub) State
  const [connectedApps, setConnectedApps] = useState([]);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);

  // Connect App Specific Modals
  const [isConnectAppModalOpen, setIsConnectAppModalOpen] = useState(false);
  const [appToConnect, setAppToConnect] = useState('LinkedIn'); // 'LinkedIn' | 'GitHub'
  const [appFormUrl, setAppFormUrl] = useState('');
  const [appFormName, setAppFormName] = useState('');
  const [appFormStats, setAppFormStats] = useState('');
  const [isConnectingApp, setIsConnectingApp] = useState(false);

  // App Post Modal (LinkedIn)
  const [isAppPostOpen, setIsAppPostOpen] = useState(false);
  const [appPostPlatform, setAppPostPlatform] = useState('LinkedIn');
  const [appPostCaption, setAppPostCaption] = useState('');
  const [appPostMediaFile, setAppPostMediaFile] = useState(null);
  const [appPostMediaPreview, setAppPostMediaPreview] = useState('');
  const [isSubmittingAppPost, setIsSubmittingAppPost] = useState(false);

  // Global action loading states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  // Load all platform states
  const loadHubData = useCallback(async () => {
    try {
      const [igRes, waRes, appsRes] = await Promise.all([
        api.getInstagramInfo().catch(() => ({ success: false })),
        api.getWhatsAppInfo().catch(() => ({ success: false })),
        api.getConnectedApps().catch(() => ({ success: false, data: [] }))
      ]);

      if (igRes?.success && igRes.data) {
        setIgInfo(igRes.data);
      }
      if (waRes?.success && waRes.data) {
        setWaInfo(waRes.data);
      }
      if (appsRes?.success && Array.isArray(appsRes.data)) {
        setConnectedApps(appsRes.data);
      }
    } catch (err) {
      console.error('[LOAD HUB ERROR]', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHubData();
  }, [loadHubData]);

  // Clean wipe
  const handleWipeArchive = async () => {
    if (!window.confirm('Are you sure you want to erase all social media data and reset connections? This will give you a clean slate.')) {
      return;
    }
    setIsWiping(true);
    try {
      const res = await api.wipeSocialArchive();
      if (res.success) {
        showToast('success', 'Clean Slate', 'Social Hub reset cleanly. You can now connect fresh.');
        loadHubData();
      } else {
        showToast('error', 'Reset Failed', res.message || 'Could not reset.');
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to erase archive.');
    } finally {
      setIsWiping(false);
    }
  };

  // ==========================================
  // INSTAGRAM HANDLERS
  // ==========================================
  const handleConnectInstagram = async (e) => {
    e.preventDefault();
    if (!igFormUrl.trim()) {
      showToast('error', 'Required Field', 'Please paste an Instagram account or profile link.');
      return;
    }
    setIsConnectingIg(true);
    try {
      const res = await api.connectInstagram({
        url: igFormUrl.trim(),
        followers: igFormFollowers.trim(),
        username: igFormUsername.trim()
      });
      if (res.success) {
        showToast('success', 'Instagram Connected', res.message || 'Instagram account connected successfully.');
        setIsIgConnectOpen(false);
        setIgFormUrl('');
        setIgFormFollowers('');
        setIgFormUsername('');
        loadHubData();
      } else {
        showToast('error', 'Connection Error', res.message || 'Failed to connect Instagram link.');
      }
    } catch (err) {
      showToast('error', 'Error', err.message || 'Failed to connect Instagram account.');
    } finally {
      setIsConnectingIg(false);
    }
  };

  const handleDisconnectInstagram = async () => {
    if (!window.confirm('Disconnect Instagram account from STIC?')) return;
    try {
      const res = await api.disconnectInstagram();
      if (res.success) {
        showToast('success', 'Disconnected', 'Instagram account disconnected.');
        loadHubData();
      } else {
        showToast('error', 'Failed', res.message || 'Could not disconnect Instagram.');
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to disconnect Instagram.');
    }
  };

  const handleRefreshInstagram = async () => {
    try {
      const res = await api.refreshInstagram();
      if (res.success) {
        showToast('success', 'Refreshed', 'Instagram data refreshed.');
        loadHubData();
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to refresh Instagram.');
    }
  };

  const handleCreateIgContent = async (e) => {
    e.preventDefault();
    if (!igMediaFile && !igMediaPreview && !igPostUrl.trim() && !igPostCaption.trim()) {
      showToast('error', 'Content Required', `Please provide a post URL, caption, or upload media for your ${igPostType}.`);
      return;
    }
    setIsSubmittingIg(true);

    try {
      const formData = new FormData();
      formData.append('post_type', igPostType);
      formData.append('caption', igPostCaption.trim() || `Instagram ${igPostType} from @${igInfo.raw_username || 'sticlub.sritatp'}`);
      if (igPostUrl.trim()) formData.append('post_url', igPostUrl.trim());
      if (igMediaFile) formData.append('media', igMediaFile);

      const res = await api.postInstagram(formData);
      if (res.success) {
        showToast('success', 'Saved & Displayed', `Instagram ${igPostType} added to your card!`);
        setIsIgPostOpen(false);
        setIgPostCaption('');
        setIgPostUrl('');
        setIgMediaFile(null);
        setIgMediaPreview('');
        loadHubData();
      } else {
        showToast('error', 'Save Failed', res.message || 'Failed to save post.');
      }
    } catch (err) {
      showToast('error', 'Error', err.message || 'Failed to publish to Instagram.');
    } finally {
      setIsSubmittingIg(false);
    }
  };

  const handleDeletePost = async (postId, platformName = 'Post') => {
    if (!window.confirm(`Are you sure you want to remove this ${platformName}?`)) return;
    try {
      const res = await api.deleteSocial(postId);
      if (res.success) {
        showToast('success', 'Removed', `${platformName} was removed successfully.`);
        setSelectedIgPostIndex(0);
        loadHubData();
      } else {
        showToast('error', 'Error', res.message || 'Failed to remove post.');
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to remove post.');
    }
  };

  // ==========================================
  // WHATSAPP HANDLERS
  // ==========================================
  const handleConnectWhatsApp = async (e) => {
    e.preventDefault();
    if (!waFormUrl.trim()) {
      showToast('error', 'Required Field', 'Please paste a WhatsApp Community or Group invite link.');
      return;
    }
    setIsConnectingWa(true);
    try {
      const res = await api.connectWhatsApp({
        url: waFormUrl.trim(),
        channel_name: waFormName.trim(),
        total_members: waFormMembers.trim()
      });
      if (res.success) {
        showToast('success', 'WhatsApp Connected', res.message || 'WhatsApp Community connected successfully.');
        setIsWaConnectOpen(false);
        setWaFormUrl('');
        setWaFormName('');
        setWaFormMembers('');
        loadHubData();
      } else {
        showToast('error', 'Connection Error', res.message || 'Failed to connect WhatsApp link.');
      }
    } catch (err) {
      showToast('error', 'Error', err.message || 'Failed to connect WhatsApp link.');
    } finally {
      setIsConnectingWa(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!window.confirm('Disconnect WhatsApp Community from STIC?')) return;
    try {
      const res = await api.disconnectWhatsApp();
      if (res.success) {
        showToast('success', 'Disconnected', 'WhatsApp Community disconnected.');
        loadHubData();
      } else {
        showToast('error', 'Failed', res.message || 'Could not disconnect WhatsApp.');
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to disconnect WhatsApp.');
    }
  };

  const handleRefreshWhatsApp = async () => {
    try {
      const res = await api.refreshWhatsApp();
      if (res.success) {
        showToast('success', 'Refreshed', 'WhatsApp Community data refreshed.');
        loadHubData();
      }
    } catch (e) {
      showToast('error', 'Error', 'Failed to refresh WhatsApp.');
    }
  };

  const handleSendWaMessage = async (e) => {
    e.preventDefault();
    if (!waMessageText.trim()) {
      showToast('error', 'Message Required', 'Please type a message before broadcasting.');
      return;
    }
    setIsSubmittingWa(true);
    try {
      const formData = new FormData();
      formData.append('message', waMessageText.trim());
      formData.append('channel_url', waInfo.channel_url || '');
      if (waMediaFile) formData.append('media', waMediaFile);

      const res = await api.broadcastWhatsApp(formData);
      if (res.success) {
        showToast('success', 'Sent & Archived', 'WhatsApp notice broadcasted successfully!');
        
        // Open WhatsApp Web prefilled with message if requested
        if (waInfo.channel_url) {
          const encText = encodeURIComponent(waMessageText.trim());
          if (waInfo.channel_url.includes('chat.whatsapp.com')) {
            window.open(waInfo.channel_url, '_blank');
          } else {
            window.open(`https://api.whatsapp.com/send?text=${encText}`, '_blank');
          }
        }

        setIsWaMessageOpen(false);
        setWaMessageText('');
        setWaMediaFile(null);
        setWaMediaPreview('');
        loadHubData();
      } else {
        showToast('error', 'Broadcast Failed', res.message || 'Failed to broadcast message.');
      }
    } catch (err) {
      showToast('error', 'Error', err.message || 'Failed to broadcast WhatsApp message.');
    } finally {
      setIsSubmittingWa(false);
    }
  };

  // ==========================================
  // CONNECTED APPS (LINKEDIN, GITHUB) HANDLERS
  // ==========================================
  const handleOpenConnectApp = (platform) => {
    setAppToConnect(platform);
    setAppFormUrl('');
    setAppFormName('');
    setAppFormStats('');
    setIsAddAppModalOpen(false);
    setIsConnectAppModalOpen(true);
  };

  const handleConnectApp = async (e) => {
    e.preventDefault();
    if (!appFormUrl.trim()) {
      showToast('error', 'Required Field', `Please enter a valid ${appToConnect} URL.`);
      return;
    }
    setIsConnectingApp(true);
    try {
      const res = await api.connectApp({
        platform: appToConnect,
        url: appFormUrl.trim(),
        account_name: appFormName.trim(),
        count_value: appFormStats.trim()
      });
      if (res.success) {
        showToast('success', `${appToConnect} Connected`, res.message || `${appToConnect} connected successfully.`);
        setIsConnectAppModalOpen(false);
        loadHubData();
      } else {
        showToast('error', 'Connection Error', res.message || `Failed to connect ${appToConnect}.`);
      }
    } catch (err) {
      showToast('error', 'Error', err.message || `Failed to connect ${appToConnect}.`);
    } finally {
      setIsConnectingApp(false);
    }
  };

  const handleDisconnectApp = async (platform) => {
    if (!window.confirm(`Disconnect ${platform} from STIC?`)) return;
    try {
      const res = await api.disconnectApp(platform);
      if (res.success) {
        showToast('success', 'Disconnected', `${platform} disconnected.`);
        loadHubData();
      } else {
        showToast('error', 'Failed', res.message || `Could not disconnect ${platform}.`);
      }
    } catch (e) {
      showToast('error', 'Error', `Failed to disconnect ${platform}.`);
    }
  };

  const handleRefreshApp = async (platform) => {
    try {
      const res = await api.refreshApp(platform);
      if (res.success) {
        showToast('success', 'Refreshed', `${platform} data refreshed.`);
        loadHubData();
      }
    } catch (e) {
      showToast('error', 'Error', `Failed to refresh ${platform}.`);
    }
  };

  const handlePostAppUpdate = async (e) => {
    e.preventDefault();
    if (!appPostCaption.trim()) {
      showToast('error', 'Content Required', 'Please enter post content.');
      return;
    }
    setIsSubmittingAppPost(true);
    try {
      const formData = new FormData();
      formData.append('platform', appPostPlatform);
      formData.append('caption', appPostCaption.trim());
      formData.append('post_type', 'Update');
      if (appPostMediaFile) formData.append('media', appPostMediaFile);

      const res = await api.postAppUpdate(formData);
      if (res.success) {
        showToast('success', 'Published', `Update posted to ${appPostPlatform}!`);
        setIsAppPostOpen(false);
        setAppPostCaption('');
        setAppPostMediaFile(null);
        setAppPostMediaPreview('');
        loadHubData();
      } else {
        showToast('error', 'Failed', res.message || 'Failed to post update.');
      }
    } catch (err) {
      showToast('error', 'Error', err.message || 'Failed to post update.');
    } finally {
      setIsSubmittingAppPost(false);
    }
  };

  // Determine Instagram active media list to show in card
  const rawIgPosts = Array.isArray(igInfo.all_posts) && igInfo.all_posts.length > 0
    ? igInfo.all_posts
    : (igInfo.latest_post ? [igInfo.latest_post] : []);

  const filteredIgList = activeIgTab === 'reel'
    ? rawIgPosts.filter(p => p.post_type?.toLowerCase() === 'reel')
    : activeIgTab === 'story'
    ? rawIgPosts.filter(p => p.post_type?.toLowerCase() === 'story')
    : rawIgPosts;

  const effectiveIgList = filteredIgList.length > 0 ? filteredIgList : rawIgPosts;
  const currentIgMedia = effectiveIgList[selectedIgPostIndex] || effectiveIgList[0] || null;

  return (
    <div style={{ padding: '24px 32px 64px', maxWidth: '1440px', margin: '0 auto', color: 'var(--text-main)' }}>
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER & HIGH-CONTRAST PAGE TITLE */}
      {/* ======================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: 'var(--text-main)',
            margin: '0 0 6px 0',
            textTransform: 'uppercase'
          }}>
            SOCIAL & CONNECTED APPS
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--text-subtle)',
            margin: 0,
            fontWeight: 500,
            lineHeight: 1.5
          }}>
            Connect your social platforms and manage important activity directly from STIC.
          </p>
        </div>

        {/* Action Controls: + Add App & Refresh / Clean Wipe */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsAddAppModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          >
            <PlusCircle size={18} />
            + Add App
          </button>

          <button
            onClick={loadHubData}
            disabled={isRefreshing}
            title="Refresh All Data"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin-anim' : ''} />
            Sync
          </button>

          <button
            onClick={handleWipeArchive}
            disabled={isWiping}
            title="Erase all social media archive and connections for a fresh start"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Trash2 size={15} />
            Erase All
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PRIMARY CHANNELS GRID: INSTAGRAM & WHATSAPP COMMUNITY */}
      {/* ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>

        {/* -------------------------------------------------------- */}
        {/* CARD 1: INSTAGRAM */}
        {/* -------------------------------------------------------- */}
        <div style={{
          backgroundColor: '#0c1220',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            {/* Card Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(225, 48, 108, 0.35)'
                }}>
                  <InstagramIcon size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Instagram</h2>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Visual Feed & Reels</span>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                backgroundColor: igInfo.connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                color: igInfo.connected ? '#34d399' : '#94a3b8',
                border: igInfo.connected ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(148, 163, 184, 0.25)'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: igInfo.connected ? '#10b981' : '#64748b',
                  boxShadow: igInfo.connected ? '0 0 8px #10b981' : 'none'
                }} />
                {igInfo.connected ? '● Connected' : '○ Not Connected'}
              </div>
            </div>

            {/* Instagram Content Body */}
            {!igInfo.connected ? (
              /* Disconnected State */
              <div style={{
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                margin: '16px 0 24px'
              }}>
                <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginBottom: '18px', lineHeight: 1.6 }}>
                  Connect your real STIC Instagram account to sync followers, showcase latest posts, and publish reels or stories directly.
                </p>
                <button
                  onClick={() => setIsIgConnectOpen(true)}
                  style={{
                    backgroundColor: '#e11d48',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px 22px',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(225, 29, 72, 0.35)'
                  }}
                >
                  Connect Instagram
                </button>
              </div>
            ) : (
              /* Connected State */
              <div>
                {/* Account Details Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '18px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                        {igInfo.username || '@stic_club_official'}
                      </span>
                      {igInfo.url && (
                        <a
                          href={igInfo.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#f43f5e', display: 'inline-flex', alignItems: 'center' }}
                          title="Open Instagram Profile"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {igInfo.account_name || 'STIC Official Profile'}
                    </span>
                  </div>

                  {/* Followers / Following Statistics */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{
                      backgroundColor: 'rgba(225, 48, 108, 0.15)',
                      color: '#f43f5e',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: '1px solid rgba(225, 48, 108, 0.3)'
                    }}>
                      Followers: {igInfo.followers || <em style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>Not available from this integration</em>}
                    </div>

                    {igInfo.following && (
                      <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#cbd5e1',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        Following: {igInfo.following}
                      </div>
                    )}
                  </div>
                </div>

                {/* Media Type Tabs (Latest Post, Reel, Story) */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  {[
                    { key: 'post', label: 'Latest Post' },
                    { key: 'reel', label: 'Latest Reel' },
                    { key: 'story', label: 'Latest Story' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveIgTab(tab.key)}
                      style={{
                        backgroundColor: activeIgTab === tab.key ? '#e11d48' : 'rgba(255, 255, 255, 0.05)',
                        color: activeIgTab === tab.key ? '#ffffff' : '#cbd5e1',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Multi-Post Switcher (e.g. Post 1 of 2) */}
                {effectiveIgList.length > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    marginBottom: '12px'
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f43f5e' }}>
                      Post {selectedIgPostIndex + 1} of {effectiveIgList.length}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setSelectedIgPostIndex(prev => Math.max(0, prev - 1))}
                        disabled={selectedIgPostIndex === 0}
                        style={{
                          backgroundColor: selectedIgPostIndex === 0 ? 'rgba(255,255,255,0.05)' : '#e11d48',
                          color: selectedIgPostIndex === 0 ? '#64748b' : '#ffffff',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: selectedIgPostIndex === 0 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        &larr; Prev
                      </button>
                      <button
                        onClick={() => setSelectedIgPostIndex(prev => Math.min(effectiveIgList.length - 1, prev + 1))}
                        disabled={selectedIgPostIndex >= effectiveIgList.length - 1}
                        style={{
                          backgroundColor: selectedIgPostIndex >= effectiveIgList.length - 1 ? 'rgba(255,255,255,0.05)' : '#e11d48',
                          color: selectedIgPostIndex >= effectiveIgList.length - 1 ? '#64748b' : '#ffffff',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: selectedIgPostIndex >= effectiveIgList.length - 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* Showcase Media Box */}
                <div style={{
                  backgroundColor: '#070b13',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  {currentIgMedia ? (
                    <div>
                      {/* Media preview (video or image) */}
                      {(currentIgMedia.poster_url || currentIgMedia.thumbnail_url) ? (
                        <div style={{
                          marginBottom: '12px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          maxHeight: '220px',
                          backgroundColor: '#000000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {currentIgMedia.media_type === 'VIDEO' ? (
                            <video
                              src={currentIgMedia.poster_url || currentIgMedia.thumbnail_url}
                              controls
                              style={{ width: '100%', maxHeight: '220px', objectFit: 'contain' }}
                            />
                          ) : (
                            <img
                              src={currentIgMedia.poster_url || currentIgMedia.thumbnail_url}
                              alt="Instagram Post"
                              style={{ width: '100%', maxHeight: '220px', objectFit: 'cover' }}
                            />
                          )}
                        </div>
                      ) : (
                        <div style={{
                          marginBottom: '12px',
                          borderRadius: '8px',
                          padding: '24px 16px',
                          background: 'linear-gradient(135deg, rgba(225,48,108,0.18) 0%, rgba(131,58,180,0.18) 100%)',
                          border: '1px solid rgba(225,48,108,0.3)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          textAlign: 'center'
                        }}>
                          <InstagramIcon size={28} className="text-rose-400" />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f43f5e' }}>
                            Instagram {currentIgMedia.post_type || 'Post'}
                          </span>
                        </div>
                      )}

                      {/* Caption & Timestamp */}
                      <p style={{
                        fontSize: '0.88rem',
                        color: '#f1f5f9',
                        margin: '0 0 10px 0',
                        lineHeight: 1.5,
                        wordBreak: 'break-word'
                      }}>
                        {currentIgMedia.caption || 'No caption provided.'}
                      </p>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        color: '#94a3b8',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingTop: '8px'
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> {formatISTDate(currentIgMedia)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {currentIgMedia.post_url && (
                            <a
                              href={currentIgMedia.post_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#f43f5e', textDecoration: 'none', fontWeight: 600 }}
                            >
                              View on Instagram &rarr;
                            </a>
                          )}
                          <button
                            onClick={() => handleDeletePost(currentIgMedia.id, 'Instagram post')}
                            title="Delete this post from STIC"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '2px 4px',
                              borderRadius: '4px'
                            }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '26px 14px', color: '#94a3b8' }}>
                      <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.92rem', marginBottom: '6px' }}>
                        Account @{igInfo.raw_username || 'sticlub.sritatp'} connected!
                      </p>
                      <p style={{ color: '#cbd5e1', fontSize: '0.84rem', marginBottom: '16px', lineHeight: 1.5 }}>
                        You have 2 posts on your Instagram account. Click below to add your 2 posts with images/videos and captions to display them on this card!
                      </p>
                      <button
                        onClick={() => {
                          setIgPostType('Post');
                          setIsIgPostOpen(true);
                        }}
                        style={{
                          backgroundColor: '#e11d48',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)'
                        }}
                      >
                        + Add / Import Your 2 Posts
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons: + Create Post, + Post Reel, + Add Story */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  <button
                    onClick={() => {
                      setIgPostType('Post');
                      setIsIgPostOpen(true);
                    }}
                    style={{
                      backgroundColor: 'rgba(225, 48, 108, 0.15)',
                      color: '#ffffff',
                      border: '1px solid rgba(225, 48, 108, 0.4)',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <ImageIcon size={14} /> + Post
                  </button>

                  <button
                    onClick={() => {
                      setIgPostType('Reel');
                      setIsIgPostOpen(true);
                    }}
                    style={{
                      backgroundColor: 'rgba(225, 48, 108, 0.15)',
                      color: '#ffffff',
                      border: '1px solid rgba(225, 48, 108, 0.4)',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Video size={14} /> + Reel
                  </button>

                  <button
                    onClick={() => {
                      setIgPostType('Story');
                      setIsIgPostOpen(true);
                    }}
                    style={{
                      backgroundColor: 'rgba(225, 48, 108, 0.15)',
                      color: '#ffffff',
                      border: '1px solid rgba(225, 48, 108, 0.4)',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Radio size={14} /> + Story
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card Management Footer */}
          {igInfo.connected && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.78rem',
              color: '#94a3b8'
            }}>
              <span>Last synced: {formatRelativeTime(igInfo.last_synced)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    setIgFormUrl(igInfo.url || '');
                    setIgFormFollowers(igInfo.followers || '');
                    setIgFormUsername(igInfo.username || '');
                    setIsIgConnectOpen(true);
                  }}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontWeight: 600 }}
                >
                  Edit
                </button>
                <button
                  onClick={handleRefreshInstagram}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 600 }}
                >
                  Refresh
                </button>
                <button
                  onClick={handleDisconnectInstagram}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* -------------------------------------------------------- */}
        {/* CARD 2: WHATSAPP COMMUNITY */}
        {/* -------------------------------------------------------- */}
        <div style={{
          backgroundColor: '#0c1220',
          border: '1px solid rgba(37, 211, 102, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            {/* Card Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#25D366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)'
                }}>
                  <WhatsAppIcon size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>WhatsApp Community</h2>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Announcements & Members</span>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                backgroundColor: waInfo.connected ? 'rgba(37, 211, 102, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                color: waInfo.connected ? '#4ade80' : '#94a3b8',
                border: waInfo.connected ? '1px solid rgba(37, 211, 102, 0.35)' : '1px solid rgba(148, 163, 184, 0.25)'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: waInfo.connected ? '#25D366' : '#64748b',
                  boxShadow: waInfo.connected ? '0 0 8px #25D366' : 'none'
                }} />
                {waInfo.connected ? '● Connected' : '○ Not Connected'}
              </div>
            </div>

            {/* WhatsApp Content Body */}
            {!waInfo.connected ? (
              /* Disconnected State */
              <div style={{
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                margin: '16px 0 24px'
              }}>
                <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginBottom: '18px', lineHeight: 1.6 }}>
                  Connect your real WhatsApp Community or official announcement group to track member counts and broadcast notices directly.
                </p>
                <button
                  onClick={() => setIsWaConnectOpen(true)}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px 22px',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(22, 163, 74, 0.35)'
                  }}
                >
                  Connect WhatsApp
                </button>
              </div>
            ) : (
              /* Connected State */
              <div>
                {/* Community Details Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '18px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                        {waInfo.channel_name || 'CSE – STIC Community'}
                      </span>
                      {waInfo.channel_url && (
                        <a
                          href={waInfo.channel_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#4ade80', display: 'inline-flex', alignItems: 'center' }}
                          title="Open WhatsApp Group"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 600 }}>
                      ● {waInfo.community_status || 'Active Community'}
                    </span>
                  </div>

                  {/* Members Badge */}
                  <div style={{
                    backgroundColor: 'rgba(37, 211, 102, 0.15)',
                    color: '#4ade80',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: '1px solid rgba(37, 211, 102, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Users size={14} />
                    Members: {waInfo.total_members || <em style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>Not available from this integration</em>}
                  </div>
                </div>

                {/* Latest Broadcast Message Bubble */}
                <div style={{
                  backgroundColor: '#070b13',
                  borderRadius: '12px',
                  border: '1px solid rgba(37, 211, 102, 0.25)',
                  padding: '16px',
                  marginBottom: '20px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#4ade80',
                      letterSpacing: '0.04em'
                    }}>
                      Latest Community Broadcast
                    </span>
                    {waInfo.latest_message && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {formatISTDate(waInfo.latest_message)}
                        </span>
                        <button
                          onClick={() => handleDeletePost(waInfo.latest_message.id, 'WhatsApp broadcast')}
                          title="Delete this broadcast"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 4px'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {waInfo.latest_message ? (
                    <div>
                      {/* Attached media preview if present */}
                      {(waInfo.latest_message.poster_url || waInfo.latest_message.thumbnail_url) && (
                        <div style={{
                          marginBottom: '10px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          maxHeight: '160px',
                          backgroundColor: '#000000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {waInfo.latest_message.media_type === 'VIDEO' ? (
                            <video
                              src={waInfo.latest_message.poster_url || waInfo.latest_message.thumbnail_url}
                              controls
                              style={{ width: '100%', maxHeight: '160px', objectFit: 'contain' }}
                            />
                          ) : (
                            <img
                              src={waInfo.latest_message.poster_url || waInfo.latest_message.thumbnail_url}
                              alt="Broadcast Attachment"
                              style={{ width: '100%', maxHeight: '160px', objectFit: 'cover' }}
                            />
                          )}
                        </div>
                      )}

                      <p style={{
                        fontSize: '0.9rem',
                        color: '#ffffff',
                        margin: 0,
                        lineHeight: 1.55,
                        wordBreak: 'break-word'
                      }}>
                        "{waInfo.latest_message.caption}"
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8', fontSize: '0.88rem' }}>
                      No announcements broadcasted yet. Click below to send a real-time message or notice.
                    </div>
                  )}
                </div>

                {/* Action Buttons: + Send Message, + Broadcast, View Recent Messages */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  <button
                    onClick={() => {
                      setWaMessageMode('message');
                      setIsWaMessageOpen(true);
                    }}
                    style={{
                      backgroundColor: 'rgba(37, 211, 102, 0.15)',
                      color: '#ffffff',
                      border: '1px solid rgba(37, 211, 102, 0.4)',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <MessageCircle size={14} /> Send Message
                  </button>

                  <button
                    onClick={() => {
                      setWaMessageMode('broadcast');
                      setIsWaMessageOpen(true);
                    }}
                    style={{
                      backgroundColor: '#15803d',
                      color: '#ffffff',
                      border: 'none',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Send size={14} /> Broadcast
                  </button>

                  <button
                    onClick={() => setIsWaTimelineOpen(true)}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Clock size={14} /> Timeline
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card Management Footer */}
          {waInfo.connected && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.78rem',
              color: '#94a3b8'
            }}>
              <span>Last synced: {formatRelativeTime(waInfo.last_synced)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    setWaFormUrl(waInfo.channel_url || '');
                    setWaFormName(waInfo.channel_name || '');
                    setWaFormMembers(waInfo.total_members || '');
                    setIsWaConnectOpen(true);
                  }}
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontWeight: 600 }}
                >
                  Edit
                </button>
                <button
                  onClick={handleRefreshWhatsApp}
                  style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontWeight: 600 }}
                >
                  Refresh
                </button>
                <button
                  onClick={handleDisconnectWhatsApp}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. ADDED APPS SECTION (LINKEDIN & GITHUB) */}
      {/* (Only rendered when the user has actually connected them) */}
      {/* ======================================================== */}
      {connectedApps.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ADDED APPS
              </h2>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Additional connected platforms and developer channels
              </span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px'
          }}>
            {connectedApps.map((app) => {
              const isGitHub = app.platform.toLowerCase() === 'github';
              const isLinkedIn = app.platform.toLowerCase() === 'linkedin';

              return (
                <div
                  key={app.platform}
                  style={{
                    backgroundColor: '#0c1220',
                    border: isGitHub 
                      ? '1px solid rgba(139, 92, 246, 0.35)' 
                      : '1px solid rgba(10, 102, 194, 0.35)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          backgroundColor: isGitHub ? '#8b5cf6' : '#0a66c2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          boxShadow: isGitHub 
                            ? '0 4px 12px rgba(139, 92, 246, 0.35)' 
                            : '0 4px 12px rgba(10, 102, 194, 0.35)'
                        }}>
                          {isGitHub ? <GitHubIcon size={22} /> : isLinkedIn ? <LinkedInIcon size={22} /> : <Layers size={22} />}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                            {app.platform}
                          </h3>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            {isGitHub ? 'Repositories & Developer Activity' : 'Professional Network & Articles'}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.35)'
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                        ● Connected
                      </div>
                    </div>

                    {/* Account Info Bar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '18px',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {app.avatar_url && (
                          <img
                            src={app.avatar_url}
                            alt={app.account_name}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                          />
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff' }}>
                              {app.account_name || `STIC ${app.platform}`}
                            </span>
                            {app.url && (
                              <a
                                href={app.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: isGitHub ? '#a855f7' : '#38bdf8' }}
                                title={`Open ${app.platform}`}
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stat Badge */}
                      <div style={{
                        backgroundColor: isGitHub ? 'rgba(139, 92, 246, 0.15)' : 'rgba(10, 102, 194, 0.15)',
                        color: isGitHub ? '#c084fc' : '#38bdf8',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        border: isGitHub ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(10, 102, 194, 0.3)'
                      }}>
                        {app.count_value || <em style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>Not available from this integration</em>}
                      </div>
                    </div>

                    {/* GitHub Specific Details: Repositories & Recent Commits */}
                    {isGitHub && (
                      <div style={{ marginBottom: '18px' }}>
                        {/* Repositories list */}
                        {Array.isArray(app.gh_repos) && app.gh_repos.length > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Recent Repositories
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                              {app.gh_repos.map((repo) => (
                                <a
                                  key={repo.name}
                                  href={repo.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    backgroundColor: '#070b13',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  <span style={{ fontWeight: 700, color: '#c084fc' }}>{repo.name}</span>
                                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Star size={12} fill="#eab308" color="#eab308" /> {repo.stars}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent commit */}
                        {app.gh_commit && (
                          <div style={{
                            padding: '10px 14px',
                            backgroundColor: '#070b13',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '0.82rem'
                          }}>
                            <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                              Latest Commit ({app.gh_commit.sha})
                            </span>
                            <span style={{ color: '#f1f5f9', fontWeight: 500 }}>"{app.gh_commit.message}"</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* LinkedIn Specific Details */}
                    {isLinkedIn && (
                      <div style={{
                        padding: '14px',
                        backgroundColor: '#070b13',
                        borderRadius: '10px',
                        border: '1px solid rgba(10, 102, 194, 0.25)',
                        marginBottom: '18px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8' }}>
                            Latest Post / Activity
                          </span>
                          {app.latest_post && (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {formatISTDate(app.latest_post)}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.88rem', color: '#f1f5f9', margin: 0, lineHeight: 1.5 }}>
                          {app.latest_post?.caption || 'Ready to publish professional updates and engineering achievements to your LinkedIn network.'}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                      {isLinkedIn && (
                        <button
                          onClick={() => {
                            setAppPostPlatform('LinkedIn');
                            setIsAppPostOpen(true);
                          }}
                          style={{
                            flex: 1,
                            backgroundColor: '#0a66c2',
                            color: '#ffffff',
                            border: 'none',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <FileText size={15} /> + Create Post
                        </button>
                      )}

                      <a
                        href={app.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          color: '#ffffff',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={15} /> Open {app.platform}
                      </a>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.78rem',
                    color: '#94a3b8'
                  }}>
                    <span>Last synced: {formatRelativeTime(app.last_synced || app.connected_at)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleRefreshApp(app.platform)}
                        style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Refresh Data
                      </button>
                      <button
                        onClick={() => handleDisconnectApp(app.platform)}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD APP SELECTION MODAL */}
      {/* ======================================================== */}
      {isAddAppModalOpen && (
        <div style={modalBackdropStyle}>
          <div style={modalContentStyle(480)}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Add Application</h3>
              <button onClick={() => setIsAddAppModalOpen(false)} style={closeBtnStyle}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '20px' }}>
                Select an external platform to connect with the STIC Social Hub:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* LinkedIn Option */}
                <button
                  onClick={() => handleOpenConnectApp('LinkedIn')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    backgroundColor: '#131e33',
                    border: '1px solid rgba(10, 102, 194, 0.4)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(10, 102, 194, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#131e33'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#0a66c2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LinkedInIcon size={22} />
                    </div>
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: 700, display: 'block' }}>LinkedIn</span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Connect Club LinkedIn page & post articles</span>
                    </div>
                  </div>
                  <span style={{ color: '#38bdf8', fontSize: '0.9rem', fontWeight: 700 }}>Connect &rarr;</span>
                </button>

                {/* GitHub Option */}
                <button
                  onClick={() => handleOpenConnectApp('GitHub')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    backgroundColor: '#131e33',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#131e33'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GitHubIcon size={22} />
                    </div>
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: 700, display: 'block' }}>GitHub</span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Showcase stars, public repositories & commits</span>
                    </div>
                  </div>
                  <span style={{ color: '#a855f7', fontSize: '0.9rem', fontWeight: 700 }}>Connect &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CONNECT INSTAGRAM MODAL */}
      {/* ======================================================== */}
      {isIgConnectOpen && (
        <div style={modalBackdropStyle}>
          <div style={modalContentStyle(520)}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <InstagramIcon size={22} className="text-rose-500" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Connect Instagram Account</h3>
              </div>
              <button onClick={() => setIsIgConnectOpen(false)} style={closeBtnStyle}><X size={20} /></button>
            </div>
            <form onSubmit={handleConnectInstagram} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Instagram Link / Profile URL *</label>
                <input
                  type="text"
                  placeholder="https://www.instagram.com/your_account"
                  value={igFormUrl}
                  onChange={(e) => setIgFormUrl(e.target.value)}
                  required
                  style={inputStyle}
                />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Paste the official STIC Instagram account or post link.
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Account Username (Optional)</label>
                <input
                  type="text"
                  placeholder="@stic_club_official"
                  value={igFormUsername}
                  onChange={(e) => setIgFormUsername(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Follower Count (Optional specify / override)</label>
                <input
                  type="text"
                  placeholder="e.g. 1,250 Followers"
                  value={igFormFollowers}
                  onChange={(e) => setIgFormFollowers(e.target.value)}
                  style={inputStyle}
                />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Leave blank to auto-detect from public metadata, or specify your exact follower count.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsIgConnectOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={isConnectingIg} style={primaryBtnStyle('#e11d48')}>
                  {isConnectingIg ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CONNECT WHATSAPP MODAL */}
      {/* ======================================================== */}
      {isWaConnectOpen && (
        <div style={modalBackdropStyle}>
          <div style={modalContentStyle(520)}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <WhatsAppIcon size={22} className="text-emerald-500" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Connect WhatsApp Community</h3>
              </div>
              <button onClick={() => setIsWaConnectOpen(false)} style={closeBtnStyle}><X size={20} /></button>
            </div>
            <form onSubmit={handleConnectWhatsApp} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>WhatsApp Community Link / Group URL *</label>
                <input
                  type="text"
                  placeholder="https://chat.whatsapp.com/invite_code"
                  value={waFormUrl}
                  onChange={(e) => setWaFormUrl(e.target.value)}
                  required
                  style={inputStyle}
                />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Paste the official WhatsApp Community invite or channel URL.
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Community / Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. CSE – STIC Official Community"
                  value={waFormName}
                  onChange={(e) => setWaFormName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Total Members Count</label>
                <input
                  type="text"
                  placeholder="e.g. 500+ Members"
                  value={waFormMembers}
                  onChange={(e) => setWaFormMembers(e.target.value)}
                  style={inputStyle}
                />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Specify the total number of enrolled students/members in this community.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsWaConnectOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={isConnectingWa} style={primaryBtnStyle('#16a34a')}>
                  {isConnectingWa ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CONNECT LINKEDIN / GITHUB MODAL */}
      {/* ======================================================== */}
      {isConnectAppModalOpen && (
        <div style={modalBackdropStyle}>
          <div style={modalContentStyle(520)}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {appToConnect === 'GitHub' ? <GitHubIcon size={22} /> : <LinkedInIcon size={22} />}
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Connect {appToConnect}</h3>
              </div>
              <button onClick={() => setIsConnectAppModalOpen(false)} style={closeBtnStyle}><X size={20} /></button>
            </div>
            <form onSubmit={handleConnectApp} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{appToConnect} URL *</label>
                <input
                  type="text"
                  placeholder={appToConnect === 'GitHub' ? 'https://github.com/organization-or-repo' : 'https://www.linkedin.com/company/your-club'}
                  value={appFormUrl}
                  onChange={(e) => setAppFormUrl(e.target.value)}
                  required
                  style={inputStyle}
                />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  {appToConnect === 'GitHub' 
                    ? 'Paste your organization or repository URL. Live stars, forks, and repos will be extracted automatically.'
                    : 'Paste your club or company page link.'}
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{appToConnect} Display Name (Optional)</label>
                <input
                  type="text"
                  placeholder={`e.g. STIC ${appToConnect}`}
                  value={appFormName}
                  onChange={(e) => setAppFormName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {appToConnect === 'LinkedIn' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Follower / Connection Count (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1,450+ Followers"
                    value={appFormStats}
                    onChange={(e) => setAppFormStats(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsConnectAppModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={isConnectingApp} style={primaryBtnStyle(appToConnect === 'GitHub' ? '#8b5cf6' : '#0a66c2')}>
                  {isConnectingApp ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: INSTAGRAM CONTENT CREATION (POST / REEL / STORY) */}
      {/* ======================================================== */}
      {isIgPostOpen && (
        <div style={modalBackdropStyle}>
          <div style={modalContentStyle(560)}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <InstagramIcon size={22} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                    Add Instagram {igPostType}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Add your 2 existing posts or create new announcements to showcase on your card.
                  </span>
                </div>
              </div>
              <button onClick={() => setIsIgPostOpen(false)} style={closeBtnStyle}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateIgContent} style={{ padding: '20px' }}>
              
              {/* Type Switcher */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['Post', 'Reel', 'Story'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setIgPostType(t)}
                    style={{
                      flex: 1,
                      backgroundColor: igPostType === t ? '#e11d48' : 'rgba(255, 255, 255, 0.05)',
                      color: igPostType === t ? '#ffffff' : '#cbd5e1',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Post URL */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Instagram Post / Reel Link</label>
                <input
                  type="text"
                  placeholder="https://www.instagram.com/p/... or /reel/..."
                  value={igPostUrl}
                  onChange={(e) => setIgPostUrl(e.target.value)}
                  style={inputStyle}
                />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Paste the direct link to this post from your Instagram profile.
                </span>
              </div>

              {/* Caption */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Caption / Announcement Text</label>
                <textarea
                  rows={3}
                  placeholder={`Write or paste your ${igPostType.toLowerCase()} caption here...`}
                  value={igPostCaption}
                  onChange={(e) => setIgPostCaption(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* Upload media file */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>
                  {igPostType === 'Reel' ? 'Upload Reel Video (.mp4, .mov) (Optional)' : 'Upload Image or Video (Optional)'}
                </label>
                <input
                  type="file"
                  accept={igPostType === 'Reel' ? 'video/*' : 'image/*,video/*'}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIgMediaFile(file);
                      setIgMediaPreview(URL.createObjectURL(file));
                    }
                  }}
                  style={inputStyle}
                />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Upload photo/video file to display media preview, or leave blank to display the Instagram card.
                </span>
              </div>

              {/* Live Preview Box */}
              {igMediaPreview && (
                <div style={{
                  marginBottom: '16px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  maxHeight: '200px',
                  backgroundColor: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                  {igMediaFile?.type.startsWith('video') ? (
                    <video src={igMediaPreview} controls style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                  ) : (
                    <img src={igMediaPreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsIgPostOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={isSubmittingIg} style={primaryBtnStyle('#e11d48')}>
                  {isSubmittingIg ? 'Saving...' : `Save & Display ${igPostType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: WHATSAPP SEND MESSAGE / BROADCAST */}
      {/* ======================================================== */}
      {isWaMessageOpen && (
        <div style={modalBackdropStyle}>
          <div style={modalContentStyle(540)}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <WhatsAppIcon size={22} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  {waMessageMode === 'broadcast' ? 'Broadcast Notice to WhatsApp Community' : 'Send WhatsApp Message'}
                </h3>
              </div>
              <button onClick={() => setIsWaMessageOpen(false)} style={closeBtnStyle}><X size={20} /></button>
            </div>
            <form onSubmit={handleSendWaMessage} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Message / Announcement Text *</label>
                <textarea
                  rows={4}
                  placeholder="Write your WhatsApp announcement or update here..."
                  value={waMessageText}
                  onChange={(e) => setWaMessageText(e.target.value)}
                  required
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Attach Picture or Video (Optional)</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setWaMediaFile(file);
                      setWaMediaPreview(URL.createObjectURL(file));
                    }
                  }}
                  style={inputStyle}
                />
              </div>

              {waMediaPreview && (
                <div style={{
                  marginBottom: '16px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  maxHeight: '160px',
                  backgroundColor: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {waMediaFile?.type.startsWith('video') ? (
                    <video src={waMediaPreview} controls style={{ width: '100%', maxHeight: '160px', objectFit: 'contain' }} />
                  ) : (
                    <img src={waMediaPreview} alt="Preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain' }} />
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsWaMessageOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={isSubmittingWa} style={primaryBtnStyle('#16a34a')}>
                  {isSubmittingWa ? 'Broadcasting...' : 'Broadcast Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 7: WHATSAPP TIMELINE (RECENT MESSAGES) */}
      {/* ======================================================== */}
      {isWaTimelineOpen && (
        <div style={modalBackdropStyle}>
          <div style={modalContentStyle(600)}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <WhatsAppIcon size={22} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  WhatsApp Community Timeline
                </h3>
              </div>
              <button onClick={() => setIsWaTimelineOpen(false)} style={closeBtnStyle}><X size={20} /></button>
            </div>
            <div style={{ padding: '20px', maxHeight: '480px', overflowY: 'auto' }}>
              {Array.isArray(waInfo.recent_messages) && waInfo.recent_messages.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {waInfo.recent_messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        padding: '14px 16px',
                        backgroundColor: '#0c1220',
                        borderRadius: '10px',
                        border: '1px solid rgba(37, 211, 102, 0.25)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 700 }}>
                          {msg.posted_by || 'Admin Broadcast'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {formatISTDate(msg)}
                          </span>
                          <button
                            onClick={() => handleDeletePost(msg.id, 'WhatsApp message')}
                            title="Delete this message"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 4px'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#f1f5f9', lineHeight: 1.5 }}>
                        {msg.caption}
                      </p>
                      {(msg.poster_url || msg.thumbnail_url) && (
                        <div style={{ marginTop: '10px', borderRadius: '6px', overflow: 'hidden', maxHeight: '160px' }}>
                          {msg.media_type === 'VIDEO' ? (
                            <video src={msg.poster_url || msg.thumbnail_url} controls style={{ width: '100%', maxHeight: '160px' }} />
                          ) : (
                            <img src={msg.poster_url || msg.thumbnail_url} alt="Attachment" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover' }} />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#94a3b8', margin: '30px 0' }}>
                  No recent messages found. Broadcast your first message using the Broadcast button.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 8: LINKEDIN POST CREATION */}
      {/* ======================================================== */}
      {isAppPostOpen && (
        <div style={modalBackdropStyle}>
          <div style={modalContentStyle(540)}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LinkedInIcon size={22} />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  Create {appPostPlatform} Post
                </h3>
              </div>
              <button onClick={() => setIsAppPostOpen(false)} style={closeBtnStyle}><X size={20} /></button>
            </div>
            <form onSubmit={handlePostAppUpdate} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Post Content / Article Description *</label>
                <textarea
                  rows={4}
                  placeholder={`Write your ${appPostPlatform} update here...`}
                  value={appPostCaption}
                  onChange={(e) => setAppPostCaption(e.target.value)}
                  required
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Attach Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAppPostMediaFile(file);
                      setAppPostMediaPreview(URL.createObjectURL(file));
                    }
                  }}
                  style={inputStyle}
                />
              </div>

              {appPostMediaPreview && (
                <div style={{ marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', maxHeight: '160px' }}>
                  <img src={appPostMediaPreview} alt="Preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain' }} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsAppPostOpen(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={isSubmittingAppPost} style={primaryBtnStyle('#0a66c2')}>
                  {isSubmittingAppPost ? 'Posting...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Scoped UI styles for maximum contrast and polish
const modalBackdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.78)',
  backdropFilter: 'blur(5px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const modalContentStyle = (maxWidth = 520) => ({
  backgroundColor: '#0c1220',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: '16px',
  width: '100%',
  maxWidth: `${maxWidth}px`,
  boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7)',
  overflow: 'hidden',
  color: '#ffffff'
});

const modalHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '18px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
  backgroundColor: '#0f172a'
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#ffffff',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  backgroundColor: '#070b13',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const cancelBtnStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  color: '#ffffff',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  padding: '10px 18px',
  borderRadius: '8px',
  fontSize: '0.88rem',
  fontWeight: 600,
  cursor: 'pointer'
};

const primaryBtnStyle = (bgColor = '#059669') => ({
  backgroundColor: bgColor,
  color: '#ffffff',
  border: 'none',
  padding: '10px 22px',
  borderRadius: '8px',
  fontSize: '0.88rem',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: `0 4px 14px ${bgColor}55`
});
