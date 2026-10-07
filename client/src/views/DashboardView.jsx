import React, { useState, useEffect } from 'react';
import { authState, api } from '../api';
import {
  Users,
  Building2,
  CalendarDays,
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  Sparkles,
  ChevronRight,
  History,
  Wallet,
  UserPlus,
  CalendarPlus,
  Receipt,
  FileUp,
  ImagePlus,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Activity,
  Target,
  Compass,
  Lightbulb,
  RotateCcw,
  FileText
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

function evaluateEventSummaryAlignment(rawSummary) {
  const text = (rawSummary || '').toLowerCase().trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const countMatches = (keywords) => {
    let matched = [];
    let score = 0;
    keywords.forEach(({ term, weight }) => {
      if (text.includes(term)) {
        matched.push(term);
        score += weight;
      }
    });
    return { score, matched };
  };

  // Pillar 1: Club Vision (CS students, technology-driven solutions, real-world problems, UN SDGs)
  const visionKeywords = [
    { term: 'computer science', weight: 16 },
    { term: 'cse', weight: 14 },
    { term: 'student', weight: 14 },
    { term: 'empower', weight: 12 },
    { term: 'technology-driven', weight: 18 },
    { term: 'technology', weight: 14 },
    { term: 'tech', weight: 10 },
    { term: 'solution', weight: 15 },
    { term: 'design', weight: 10 },
    { term: 'real-world', weight: 18 },
    { term: 'real world', weight: 18 },
    { term: 'problem', weight: 14 },
    { term: 'united nations', weight: 18 },
    { term: 'sdg', weight: 22 },
    { term: 'sustainable development', weight: 20 },
    { term: 'impact', weight: 10 }
  ];

  // Pillar 2: Objective 1 - Promote socially responsible computing
  const obj1Keywords = [
    { term: 'socially responsible', weight: 26 },
    { term: 'social', weight: 15 },
    { term: 'responsible', weight: 16 },
    { term: 'computing', weight: 16 },
    { term: 'ethical', weight: 16 },
    { term: 'ethics', weight: 14 },
    { term: 'community', weight: 16 },
    { term: 'society', weight: 15 },
    { term: 'societal', weight: 15 },
    { term: 'accessibility', weight: 15 },
    { term: 'inclusive', weight: 14 },
    { term: 'public', weight: 12 },
    { term: 'rural', weight: 14 },
    { term: 'healthcare', weight: 14 },
    { term: 'education', weight: 12 },
    { term: 'safety', weight: 12 },
    { term: 'privacy', weight: 12 },
    { term: 'awareness', weight: 12 }
  ];

  // Pillar 3: Objective 2 - Encourage innovation, research, and entrepreneurship
  const obj2Keywords = [
    { term: 'innovation', weight: 22 },
    { term: 'innovative', weight: 16 },
    { term: 'innovate', weight: 16 },
    { term: 'research', weight: 22 },
    { term: 'entrepreneurship', weight: 22 },
    { term: 'entrepreneur', weight: 18 },
    { term: 'startup', weight: 18 },
    { term: 'incubation', weight: 16 },
    { term: 'paper', weight: 14 },
    { term: 'patent', weight: 16 },
    { term: 'prototype', weight: 16 },
    { term: 'hackathon', weight: 16 },
    { term: 'ideation', weight: 15 },
    { term: 'pitch', weight: 14 },
    { term: 'mvp', weight: 14 },
    { term: 'product', weight: 12 }
  ];

  // Pillar 4: Objective 3 - Apply AI, Data Analytics, IoT, and Software Engineering to societal challenges
  const obj3Keywords = [
    { term: 'ai', weight: 20 },
    { term: 'artificial intelligence', weight: 22 },
    { term: 'machine learning', weight: 18 },
    { term: 'deep learning', weight: 16 },
    { term: 'data analytics', weight: 22 },
    { term: 'data science', weight: 18 },
    { term: 'analytics', weight: 15 },
    { term: 'data', weight: 12 },
    { term: 'iot', weight: 22 },
    { term: 'internet of things', weight: 22 },
    { term: 'sensor', weight: 14 },
    { term: 'embedded', weight: 14 },
    { term: 'software engineering', weight: 22 },
    { term: 'software', weight: 15 },
    { term: 'application', weight: 12 },
    { term: 'cloud', weight: 12 },
    { term: 'algorithm', weight: 12 },
    { term: 'automation', weight: 14 },
    { term: 'challenge', weight: 12 }
  ];

  // Pillar 5: Objective 4 - Align student projects with global sustainability goals
  const obj4Keywords = [
    { term: 'global sustainability', weight: 24 },
    { term: 'sustainability', weight: 22 },
    { term: 'sustainable', weight: 20 },
    { term: 'student project', weight: 20 },
    { term: 'project', weight: 15 },
    { term: 'global', weight: 14 },
    { term: 'goal', weight: 14 },
    { term: 'green', weight: 16 },
    { term: 'environment', weight: 16 },
    { term: 'climate', weight: 16 },
    { term: 'renewable', weight: 16 },
    { term: 'energy', weight: 14 },
    { term: 'solar', weight: 14 },
    { term: 'waste', weight: 14 },
    { term: 'water', weight: 14 },
    { term: 'carbon', weight: 16 },
    { term: 'smart city', weight: 16 },
    { term: 'agriculture', weight: 15 },
    { term: 'eco', weight: 14 }
  ];

  const vRes = countMatches(visionKeywords);
  const o1Res = countMatches(obj1Keywords);
  const o2Res = countMatches(obj2Keywords);
  const o3Res = countMatches(obj3Keywords);
  const o4Res = countMatches(obj4Keywords);

  // Depth bonus based on how detailed the event summary is
  const depthBonus = Math.min(18, Math.round(wordCount * 0.45));

  const calcPillarPct = (rawScore) => {
    if (wordCount === 0) return 0;
    const base = Math.min(100, Math.round(14 + rawScore * 1.15 + depthBonus * 0.6));
    return Math.max(12, Math.min(98, base));
  };

  const visionPct = calcPillarPct(vRes.score);
  const obj1Pct = calcPillarPct(o1Res.score);
  const obj2Pct = calcPillarPct(o2Res.score);
  const obj3Pct = calcPillarPct(o3Res.score);
  const obj4Pct = calcPillarPct(o4Res.score);

  const overallMatchPct = Math.round(
    visionPct * 0.28 +
    obj1Pct * 0.18 +
    obj2Pct * 0.18 +
    obj3Pct * 0.18 +
    obj4Pct * 0.18
  );

  const gapPct = Math.max(0, 100 - overallMatchPct);

  // Generate 8 comprehensive work improvement points tailored to the event summary
  const improvementPoints = [
    {
      number: '01',
      title: 'UN SDG Target Mapping & Vision Alignment Work',
      category: 'Vision & SDG Alignment',
      status: visionPct >= 75 ? 'Strong Foundation · Expand Metrics' : 'High-Priority Improvement (+12% Match)',
      description:
        visionPct >= 75
          ? 'Your summary connects well with real-world problem solving. Next, explicitly assign 1–3 specific UN SDG numbers (e.g., SDG 7 Clean Energy, SDG 9 Industry & Innovation, SDG 13 Climate Action) to every event track and measure quantifiable SDG impact.'
          : 'Explicitly map the event workflow to United Nations Sustainable Development Goals (SDGs). Define concrete real-world problem statements before the event so Computer Science students design targeted, technology-driven solutions rather than generic exercises.'
    },
    {
      number: '02',
      title: 'Technical Depth in AI, Data Analytics, IoT & Software Engineering',
      category: 'Core Tech Stack Execution',
      status: obj3Pct >= 75 ? 'Tech Stack Present · Deepen Prototypes' : 'High-Priority Improvement (+14% Match)',
      description:
        obj3Pct >= 75
          ? 'Core technical domains are reflected in the event. Improve technical work by requiring live architectural diagrams, open datasets, IoT sensor telemetry, and production-grade software engineering code reviews during evaluation.'
          : 'Integrate hands-on technical labs and project milestones combining AI/ML models, Data Analytics dashboards, IoT hardware kits, and modular Software Engineering practices directly addressing societal challenges.'
    },
    {
      number: '03',
      title: 'Socially Responsible Computing & Ethical Impact Audit',
      category: 'Socially Responsible Computing',
      status: obj1Pct >= 75 ? 'Community Focus Active · Add Ethics Rubric' : 'Action Needed (+10% Match)',
      description:
        obj1Pct >= 75
          ? 'Social benefit is highlighted. Strengthen event work by adding a mandatory "Responsible Computing Checklist" covering data privacy, low-bandwidth rural accessibility, inclusive UI/UX, and energy-efficient green coding.'
          : 'Embed socially responsible computing into the event work by focusing on underserved communities, healthcare, education, accessibility, ethical AI bias mitigation, and citizen welfare outcomes.'
    },
    {
      number: '04',
      title: 'Innovation, Research Paper & Entrepreneurship Pipeline',
      category: 'Research & Startup Incubation',
      status: obj2Pct >= 75 ? 'Innovation Active · Convert to Patents/Startups' : 'Action Needed (+11% Match)',
      description:
        obj2Pct >= 75
          ? 'Innovation elements are evident. Elevate the event output by pairing winning student teams with faculty mentors to convert their event prototypes into IEEE/Scopus research papers, patent filings, or campus startup incubation pitches.'
          : 'Restructure the event workflow to move beyond theory into innovation, research, and entrepreneurship—introduce ideation sprints, MVP prototype building, business model canvases, and research abstract submissions.'
    },
    {
      number: '05',
      title: 'Global Sustainability Project Deliverables & Carbon-Conscious Operations',
      category: 'Global Sustainability Goals',
      status: obj4Pct >= 75 ? 'Sustainability Aligned · Track Long-Term KPIs' : 'High-Priority Improvement (+12% Match)',
      description:
        obj4Pct >= 75
          ? 'Sustainability themes are well represented. Improve event execution by enforcing zero-waste paperless event logistics (digital certificates, QR check-ins) and tracking environmental KPIs of student projects over 6 months.'
          : 'Align student projects directly with global sustainability goals (renewable energy, smart agriculture, water conservation, waste reduction, carbon footprint tracking) and run paperless, eco-friendly event operations.'
    },
    {
      number: '06',
      title: 'Pre-Event Groundwork, Curriculum Readiness & Lab Preparation',
      category: 'Pre-Event Work Improvement',
      status: wordCount >= 45 ? 'Structured Summary · Standardize SOPs' : 'Operational Improvement (+8% Match)',
      description:
        'Strengthen pre-event preparation by circulating starter repositories, pre-configured datasets, hardware inventory checklists, and transparent evaluation rubrics 7 days prior so participants spend 100% of event time building high-impact solutions.'
    },
    {
      number: '07',
      title: 'Cross-Wing Coordination, Industry Mentorship & Field Validation',
      category: 'On-Ground Event Execution',
      status: 'Wing Synergy & Stakeholder Work (+9% Match)',
      description:
        'Synchronize all 5 CSE–STIC functional wings (Technical, Operations, Finance, Media, Outreach) with clear time-boxed run-of-show schedules, and invite industry experts, NGOs, or civic stakeholders to validate whether student solutions solve authentic real-world problems.'
    },
    {
      number: '08',
      title: 'Post-Event Documentation, GitHub Archiving & Deployment Follow-Up',
      category: 'Post-Event Work & Continuity',
      status: 'Continuity & Impact Audit (+8% Match)',
      description:
        'Complete the event lifecycle by archiving all student project source code, datasets, financial receipts, participant feedback analytics, and an official SDG Alignment Report in the STIC portal, while selecting top projects for real campus/community deployment.'
    }
  ];

  return {
    overallMatchPct,
    gapPct,
    wordCount,
    pillars: [
      { label: 'Club Vision (Tech Solutions, Real-World Problems & UN SDGs)', pct: visionPct, color: '#14b8a6' },
      { label: 'Objective 1: Promote Socially Responsible Computing', pct: obj1Pct, color: '#38bdf8' },
      { label: 'Objective 2: Encourage Innovation, Research & Entrepreneurship', pct: obj2Pct, color: '#a855f7' },
      { label: 'Objective 3: Apply AI, Data Analytics, IoT & Software Eng.', pct: obj3Pct, color: '#f59e0b' },
      { label: 'Objective 4: Align Projects with Global Sustainability Goals', pct: obj4Pct, color: '#10b981' }
    ],
    improvementPoints
  };
}

export default function DashboardView({
  stats,
  loading,
  setView,
  setSelectedProgramId,
  onOpenQuickAction
}) {
  const user = authState.getUser();
  const [eventTitleInput, setEventTitleInput] = useState('');
  const [eventSummaryInput, setEventSummaryInput] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evalError, setEvalError] = useState('');
  const [liveFinance, setLiveFinance] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api.getFinanceOverview()
      .then(res => {
        if (isMounted && res?.data?.allTime) {
          setLiveFinance(res.data);
        }
      })
      .catch(err => {
        console.warn('Dashboard finance sync warning:', err);
      });
    return () => { isMounted = false; };
  }, [stats]);

  if (loading || !stats) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div
          style={{
            display: 'inline-block',
            width: '36px',
            height: '36px',
            border: '3px solid var(--border-subtle)',
            borderTopColor: 'var(--primary-light)',
            borderRadius: '50%',
            animation: 'spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite'
          }}
        />
        <p style={{ marginTop: '16px', fontSize: '0.92rem', fontWeight: 500, letterSpacing: '0.02em' }}>
          Preparing CSE – STIC Executive Dashboard...
        </p>
      </div>
    );
  }

  const { summary, monthlyPrograms, departments, recentPrograms, recentTransactions, clubSettings } = stats;

  const formatINR = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  const totalInflow = liveFinance?.allTime?.totalIncome !== undefined
    ? Number(liveFinance.allTime.totalIncome)
    : Number(summary?.totalCollected || 0);
  const totalOutflow = liveFinance?.allTime?.totalExpense !== undefined
    ? Number(liveFinance.allTime.totalExpense)
    : Number(summary?.totalSpent || 0);
  const netBalance = liveFinance?.allTime?.netBalance !== undefined
    ? Number(liveFinance.allTime.netBalance)
    : Number(summary?.currentBalance || 0);
  const utilizationPct = totalInflow > 0 ? Math.min(100, Math.round((totalOutflow / totalInflow) * 100)) : 0;
  const reservePct = Math.max(0, 100 - utilizationPct);

  // Modern Bar Chart Configuration
  const monthlyChartData = {
    labels: (monthlyPrograms || []).map(m => m.month),
    datasets: [
      {
        label: 'Programs Conducted',
        data: (monthlyPrograms || []).map(m => m.count),
        backgroundColor: 'rgba(56, 189, 248, 0.85)',
        hoverBackgroundColor: '#38bdf8',
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 24
      }
    ]
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0c162c',
        titleColor: '#f8fafc',
        bodyColor: '#38bdf8',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (context) => ` ${context.parsed.y} Programs Executed`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11, weight: '600' } }
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.16)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11 }, stepSize: 1, precision: 0 }
      }
    }
  };

  // Modern Doughnut Chart Configuration
  const financeDoughnutData = {
    labels: ['Money Spent (Outflow)', 'Current Balance (Reserve)'],
    datasets: [
      {
        data: [totalOutflow, Math.max(0, netBalance)],
        backgroundColor: ['rgba(244, 63, 94, 0.85)', 'rgba(16, 185, 129, 0.9)'],
        borderColor: ['rgba(148, 163, 184, 0.25)', 'rgba(148, 163, 184, 0.25)'],
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const financeDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#64748b',
          boxWidth: 10,
          boxHeight: 10,
          padding: 16,
          font: { size: 12, weight: '600' },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: 'rgba(51, 65, 85, 0.6)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${formatINR(ctx.raw)}`
        }
      }
    },
    cutout: '74%'
  };

  return (
    <div className="page-container" style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* 1. CLASSY HERO & PORTAL EMBLEM HEADER */}
      <div className="dashboard-hero-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="dashboard-logo-gem">
            <img
              src="/stic_logo.png"
              alt="CSE – STIC"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>CSE – STIC</span>
              </h1>
              <span className="dashboard-tag-pill">
                <Sparkles size={12} /> Innovate · Sustain · Impact
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                <span className="status-indicator-dot active" />
                AY {summary.currentYear || new Date().getFullYear()} Active
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-subtle)' }}>
              {clubSettings?.club_full_name || 'Sustainable Technology & Innovation Club'} · Executive Command Center
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setView('activity-log')}
            style={{ borderRadius: 'var(--radius-md)', padding: '8px 14px', fontSize: '0.84rem' }}
          >
            <History size={15} />
            Activity Log
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onOpenQuickAction('program')}
            style={{ borderRadius: 'var(--radius-md)', padding: '8px 16px', fontSize: '0.84rem', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
          >
            <Plus size={16} />
            + New Program
          </button>
        </div>
      </div>


      {/* 3. CLEAN EXECUTIVE QUICK ACTIONS DECK */}
      <div style={{ marginBottom: '22px' }}>
        <div className="dashboard-section-head">
          <div className="dashboard-section-title">
            <Sparkles size={14} className="accent-text" />
            <span>Executive Fast Track</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
            One-click creation for all club records
          </span>
        </div>

        <div className="dashboard-quick-deck">
          <button className="dashboard-quick-btn" onClick={() => onOpenQuickAction('member')}>
            <div className="dashboard-quick-icon" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
              <UserPlus size={16} />
            </div>
            <div>
              <div style={{ lineHeight: 1.2 }}>Add Member</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 400 }}>New Student</div>
            </div>
          </button>

          <button className="dashboard-quick-btn" onClick={() => onOpenQuickAction('program')}>
            <div className="dashboard-quick-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
              <CalendarPlus size={16} />
            </div>
            <div>
              <div style={{ lineHeight: 1.2 }}>Add Program</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 400 }}>Event / Workshop</div>
            </div>
          </button>

          <button className="dashboard-quick-btn" onClick={() => onOpenQuickAction('transaction')}>
            <div className="dashboard-quick-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
              <Receipt size={16} />
            </div>
            <div>
              <div style={{ lineHeight: 1.2 }}>Add Transaction</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 400 }}>Inflow / Outflow</div>
            </div>
          </button>

          <button className="dashboard-quick-btn" onClick={() => onOpenQuickAction('document')}>
            <div className="dashboard-quick-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
              <FileUp size={16} />
            </div>
            <div>
              <div style={{ lineHeight: 1.2 }}>Upload Document</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 400 }}>Reports & Docs</div>
            </div>
          </button>

          <button className="dashboard-quick-btn" onClick={() => onOpenQuickAction('photo')}>
            <div className="dashboard-quick-icon" style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#f472b6' }}>
              <ImagePlus size={16} />
            </div>
            <div>
              <div style={{ lineHeight: 1.2 }}>Upload Photo</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 400 }}>Gallery Moments</div>
            </div>
          </button>

          <button className="dashboard-quick-btn" onClick={() => onOpenQuickAction('sponsor')}>
            <div className="dashboard-quick-icon" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#facc15' }}>
              <Award size={16} />
            </div>
            <div>
              <div style={{ lineHeight: 1.2 }}>Add Sponsor</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 400 }}>Grant & Partner</div>
            </div>
          </button>
        </div>
      </div>

      {/* 4. FINANCIAL TREASURY FLOW (CLEAN, MATHEMATICAL & TRANSPARENT) */}
      <div style={{ marginBottom: '24px' }}>
        <div className="dashboard-section-head">
          <div className="dashboard-section-title">
            <Wallet size={14} style={{ color: '#34d399' }} />
            <span>STIC Treasury Overview</span>
            <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 8px', marginLeft: '6px' }}>
              Mathematical Balance
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
            <span>Order of Flow:</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>1. Total Collected</span>
            <span>―</span>
            <span style={{ color: '#fb7185', fontWeight: 600 }}>2. Total Spent</span>
            <span>=</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>3. Current Balance</span>
          </div>
        </div>

        <div className="dashboard-treasury-grid">
          {/* Card 1: Total Inflow */}
          <div className="dashboard-treasury-card inflow" onClick={() => setView('finance')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowDownRight size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                    1. TOTAL COLLECTED
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Gross Club Inflow</div>
                </div>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                + INFLOW
              </span>
            </div>

            <div style={{ fontSize: '1.95rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: '4px 0 10px 0' }}>
              {formatINR(totalInflow)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              <span>Registrations & Grants</span>
              <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                Ledger <ChevronRight size={13} />
              </span>
            </div>
          </div>

          {/* Card 2: Total Outflow */}
          <div className="dashboard-treasury-card outflow" onClick={() => setView('finance')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.12)', color: '#fb7185', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUpRight size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                    2. TOTAL SPENT
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Cumulative Outflow</div>
                </div>
              </div>
              <span className="badge badge-danger" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                - OUTFLOW
              </span>
            </div>

            <div style={{ fontSize: '1.95rem', fontWeight: 800, color: '#fb7185', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: '4px 0 10px 0' }}>
              {formatINR(totalOutflow)}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              <span>Event Operations & Logistics</span>
              <span style={{ color: '#fb7185', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                Audit <ChevronRight size={13} />
              </span>
            </div>
          </div>

          {/* Card 3: Current Net Balance */}
          <div className="dashboard-treasury-card balance" onClick={() => setView('finance')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.12)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                    3. CURRENT BALANCE
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Net Liquid Treasury</div>
                </div>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                = NET RESERVE
              </span>
            </div>

            <div
              style={{
                fontSize: '1.95rem',
                fontWeight: 800,
                color: netBalance >= 0 ? '#34d399' : '#fb7185',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em',
                margin: '4px 0 10px 0'
              }}
            >
              {formatINR(netBalance)}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-subtle)', marginBottom: '5px' }}>
                <span>Budget Ratio</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                  {utilizationPct}% Spent · {reservePct}% Available
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${utilizationPct}%`, background: '#fb7185', transition: 'width 0.4s ease' }} />
                <div style={{ width: `${reservePct}%`, background: '#34d399', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. OPERATIONAL VITALITY STRIP (ALL 5 CORE METRICS OPEN & ELEGANT) */}
      <div style={{ marginBottom: '24px' }}>
        <div className="dashboard-section-head">
          <div className="dashboard-section-title">
            <Activity size={14} className="accent-text" />
            <span>Operational Vitality & Campus Activity</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
            Real-time club engagement metrics
          </span>
        </div>

        <div className="dashboard-ops-grid">
          {/* Metric 1: Total Members */}
          <div className="dashboard-op-card" onClick={() => setView('members')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>Members</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={15} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              {summary.totalMembers}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '4px', fontWeight: 500 }}>
              {summary.activeMembers} Active in Club
            </div>
          </div>

          {/* Metric 2: Functional Wings */}
          <div className="dashboard-op-card" onClick={() => setView('departments')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>Wings / Depts</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={15} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              {summary.totalDepartments}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
              5 Functional Wings
            </div>
          </div>

          {/* Metric 3: Total Programs */}
          <div className="dashboard-op-card" onClick={() => setView('programs')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Programs</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarDays size={15} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
              {summary.totalPrograms}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
              {summary.programsThisYear} Scheduled in {summary.currentYear}
            </div>
          </div>

          {/* Metric 4: Upcoming Programs */}
          <div className="dashboard-op-card" onClick={() => setView('programs')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>Upcoming</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={15} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-display)' }}>
              {summary.upcomingPrograms}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
              Campus Agenda
            </div>
          </div>

          {/* Metric 5: Completed Programs */}
          <div className="dashboard-op-card" onClick={() => setView('programs')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>Completed</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={15} />
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-display)' }}>
              {summary.completedPrograms}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
              Archived & Recorded
            </div>
          </div>
        </div>
      </div>

      {/* 6. VISUAL ANALYTICS (SIDE-BY-SIDE CHARTS WITH REFINED SURFACES) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Monthly Activity Bar Chart */}
        <div className="stic-card" style={{ marginBottom: 0 }}>
          <div className="card-header-bar" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarDays size={18} color="var(--primary-light)" />
              <h3 style={{ margin: 0, fontSize: '1.02rem' }}>
                Program Execution Cadence ({summary.currentYear})
              </h3>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.74rem', padding: '4px 10px' }}>
              {summary.programsThisMonth} This Month
            </span>
          </div>
          <div className="card-body" style={{ padding: '24px' }}>
            <div style={{ height: '240px' }}>
              <Bar data={monthlyChartData} options={monthlyChartOptions} />
            </div>
          </div>
        </div>

        {/* Financial Reserve Doughnut Chart */}
        <div className="stic-card" style={{ marginBottom: 0 }}>
          <div className="card-header-bar" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} color="#34d399" />
              <h3 style={{ margin: 0, fontSize: '1.02rem' }}>
                Treasury Allocation &amp; Net Reserve
              </h3>
            </div>
            <span className="badge badge-success" style={{ fontSize: '0.74rem', padding: '4px 10px' }}>
              Live Calculations
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ height: '240px', width: '100%', position: 'relative' }}>
              <Doughnut data={financeDoughnutData} options={financeDoughnutOptions} />
              <div
                style={{
                  position: 'absolute',
                  top: '40%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Inflow
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  {formatINR(totalInflow)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. STIC 6 FUNCTIONAL DEPARTMENTS & WINGS */}
      <div className="stic-card" style={{ marginBottom: '32px' }}>
        <div className="card-header-bar" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={18} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0, fontSize: '1.02rem' }}>
              CSE – STIC Functional Wings &amp; Leadership (6 Wings)
            </h3>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setView('departments')}
            style={{ fontSize: '0.8rem', padding: '7px 14px' }}
          >
            Manage Wings <ArrowRight size={13} />
          </button>
        </div>

        <div className="card-body" style={{ padding: '24px' }}>
          <div className="dashboard-dept-grid">
            {(departments || []).map((dept) => (
              <div
                key={dept.id}
                className="dashboard-dept-card"
                onClick={() => setView('departments')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dept.name}
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem', padding: '2px 8px', flexShrink: 0 }}>
                    {dept.member_count}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>Lead:</span>
                    <span style={{ color: dept.lead_name ? 'var(--primary-light)' : 'var(--text-subtle)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dept.lead_name || 'Unassigned'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>Co-Lead 1:</span>
                    <span style={{ color: (dept.co_lead_1_name || dept.co_lead_name) ? '#38bdf8' : 'var(--text-subtle)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dept.co_lead_1_name || dept.co_lead_name || 'Unassigned'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: 'var(--text-subtle)', fontWeight: 600 }}>Co-Lead 2:</span>
                    <span style={{ color: dept.co_lead_2_name ? '#c084fc' : 'var(--text-subtle)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dept.co_lead_2_name || 'Unassigned'}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', lineHeight: 1.45, margin: '6px 0 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {dept.description || 'Core wing contributing to club operations and projects.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 8. RECENT ACTIVITY & LEDGER (PROGRAMS & FINANCIAL TRANSACTIONS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
        {/* Recent Programs Table */}
        <div className="stic-card" style={{ marginBottom: 0 }}>
          <div className="card-header-bar" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarDays size={18} color="var(--primary-light)" />
              <h3 style={{ margin: 0, fontSize: '1.02rem' }}>
                Recent Programs
              </h3>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setView('programs')}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              View All ({summary.totalPrograms})
            </button>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {recentPrograms && recentPrograms.length > 0 ? (
              <div className="table-responsive">
                <table className="stic-table">
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 16px', fontSize: '0.74rem' }}>Program & Venue</th>
                      <th style={{ padding: '10px 16px', fontSize: '0.74rem' }}>Date</th>
                      <th style={{ padding: '10px 16px', fontSize: '0.74rem' }}>Status</th>
                      <th style={{ padding: '10px 16px', fontSize: '0.74rem' }}>Balance</th>
                      <th style={{ padding: '10px 16px', fontSize: '0.74rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPrograms.map((prog) => {
                      let statusBadge = 'badge-neutral';
                      let dotClass = '';
                      if (prog.status === 'Completed') {
                        statusBadge = 'badge-success';
                        dotClass = 'active';
                      } else if (prog.status === 'Upcoming') {
                        statusBadge = 'badge-info';
                        dotClass = 'upcoming';
                      } else if (prog.status === 'Ongoing') {
                        statusBadge = 'badge-warning';
                        dotClass = 'warning';
                      }

                      return (
                        <tr key={prog.id}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.84rem' }}>
                              {prog.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                              {prog.program_code} {prog.venue ? `· ${prog.venue}` : ''}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.78rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                            {prog.program_date}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className={`badge ${statusBadge}`} style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem', padding: '2px 8px' }}>
                              <span className={`status-indicator-dot ${dotClass}`} />
                              {prog.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: prog.balance >= 0 ? '#34d399' : '#fb7185', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                            {formatINR(prog.balance)}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedProgramId(prog.id);
                                setView('program-detail');
                              }}
                              style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                            >
                              Open <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.86rem' }}>
                No recent programs found. Click "+ Add Program" to schedule an event.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="stic-card" style={{ marginBottom: 0 }}>
          <div className="card-header-bar" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IndianRupee size={17} color="#34d399" />
              <h3 style={{ margin: 0, fontSize: '0.98rem' }}>
                Recent Transactions
              </h3>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setView('finance')}
              style={{ fontSize: '0.78rem', padding: '5px 12px' }}
            >
              View Ledger
            </button>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {recentTransactions && recentTransactions.length > 0 ? (
              <div className="table-responsive">
                <table className="stic-table">
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 16px', fontSize: '0.74rem' }}>Ref & Description</th>
                      <th style={{ padding: '10px 16px', fontSize: '0.74rem' }}>Category</th>
                      <th style={{ padding: '10px 16px', fontSize: '0.74rem', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((txn) => (
                      <tr key={txn.id}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.84rem' }}>
                            {txn.description || txn.transaction_code}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                            {txn.date} · {txn.program_name || 'General Operations'} · via {txn.payment_method}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '0.7rem', padding: '2px 7px' }}>
                            {txn.category}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            fontWeight: 700,
                            color: txn.type === 'Income' ? '#34d399' : '#fb7185',
                            whiteSpace: 'nowrap',
                            textAlign: 'right',
                            fontSize: '0.86rem'
                          }}
                        >
                          {txn.type === 'Income' ? '+' : '-'} {formatINR(txn.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.86rem' }}>
                No recent transactions recorded in ledger.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 9. CLUB VISION, OBJECTIVES & EVENT SUMMARY ALIGNMENT EVALUATOR (AT THE BOTTOM OF DASHBOARD) */}
      <div style={{ marginTop: '36px' }}>
        <div className="dashboard-section-head" style={{ marginBottom: '16px' }}>
          <div className="dashboard-section-title">
            <Compass size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 800, fontSize: '0.96rem', letterSpacing: '0.03em', color: 'var(--text-main)' }}>
              CSE – STIC VISION, OBJECTIVES &amp; EVENT ALIGNMENT EVALUATOR
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
            UN SDGs · Sustainable Computing · Event Impact Audit
          </span>
        </div>

        {/* CLUB VISION & OBJECTIVES CARD (THICK LETTERS WITH DOTS IN SLEEK 2-COLUMN EXECUTIVE GRID) */}
        <div
          className="stic-card"
          style={{
            marginBottom: '28px',
            border: '1px solid var(--border-highlight)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div className="card-body" style={{ padding: '30px 32px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '32px',
                alignItems: 'stretch'
              }}
            >
              {/* LEFT COLUMN: CLUB VISION */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: '4px solid var(--primary)',
                  borderRadius: '16px',
                  padding: '26px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '18px'
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '16px',
                      paddingBottom: '14px',
                      borderBottom: '1px solid var(--border-subtle)'
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.22rem',
                        fontWeight: 900,
                        color: 'var(--text-main)',
                        letterSpacing: '-0.01em',
                        fontFamily: 'var(--font-display)'
                      }}
                    >
                      Club Vision
                    </h3>
                    <span
                      className="badge badge-success"
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '4px 10px'
                      }}
                    >
                      Innovate · Sustain · Impact
                    </span>
                  </div>

                  {/* Club Vision Statement in Thick Letters with Dot */}
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0
                    }}
                  >
                    <li
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        fontSize: '1.08rem',
                        lineHeight: 1.7,
                        fontWeight: 700,
                        color: 'var(--text-main)'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '1.5rem',
                          lineHeight: 1.15,
                          color: 'var(--primary)',
                          fontWeight: 900,
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        •
                      </span>
                      <span style={{ fontWeight: 700, letterSpacing: '0.01em', color: 'var(--text-main)' }}>
                        To empower Computer Science students to design{' '}
                        <strong style={{ fontWeight: 900, color: 'var(--primary)' }}>
                          technology-driven solutions
                        </strong>{' '}
                        that address{' '}
                        <strong style={{ fontWeight: 900, color: 'var(--accent-cyan)' }}>
                          real-world problems
                        </strong>{' '}
                        aligned with the{' '}
                        <strong
                          style={{
                            fontWeight: 900,
                            color: 'var(--text-main)',
                            textDecoration: 'underline',
                            textDecorationColor: 'var(--primary)',
                            textUnderlineOffset: '4px'
                          }}
                        >
                          United Nations Sustainable Development Goals (SDGs)
                        </strong>
                        .
                      </span>
                    </li>
                  </ul>
                </div>

                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-subtle)',
                    fontWeight: 600,
                    paddingTop: '12px',
                    borderTop: '1px dashed var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Department of Computer Science &amp; Engineering</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>SRIT (Autonomous)</span>
                </div>
              </div>

              {/* RIGHT COLUMN: CLUB OBJECTIVES */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: '4px solid var(--accent-cyan)',
                  borderRadius: '16px',
                  padding: '26px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '16px',
                    paddingBottom: '14px',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.22rem',
                      fontWeight: 900,
                      color: 'var(--text-main)',
                      letterSpacing: '-0.01em',
                      fontFamily: 'var(--font-display)'
                    }}
                  >
                    Club Objectives
                  </h3>
                  <span
                    className="badge badge-info"
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '4px 10px'
                    }}
                  >
                    4 Core Pillars
                  </span>
                </div>

                {/* Club Objectives List in Thick Letters with Dots */}
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <li
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      fontSize: '1.02rem',
                      lineHeight: 1.5,
                      fontWeight: 700,
                      color: 'var(--text-main)'
                    }}
                  >
                    <span style={{ fontSize: '1.45rem', lineHeight: 1.05, color: 'var(--primary)', fontWeight: 900, flexShrink: 0 }}>
                      •
                    </span>
                    <span>
                      Promote <strong style={{ fontWeight: 900, color: 'var(--text-main)' }}>socially responsible computing</strong>
                    </span>
                  </li>

                  <li
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      fontSize: '1.02rem',
                      lineHeight: 1.5,
                      fontWeight: 700,
                      color: 'var(--text-main)'
                    }}
                  >
                    <span style={{ fontSize: '1.45rem', lineHeight: 1.05, color: 'var(--accent-cyan)', fontWeight: 900, flexShrink: 0 }}>
                      •
                    </span>
                    <span>
                      Encourage <strong style={{ fontWeight: 900, color: 'var(--text-main)' }}>innovation, research, and entrepreneurship</strong>
                    </span>
                  </li>

                  <li
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      fontSize: '1.02rem',
                      lineHeight: 1.5,
                      fontWeight: 700,
                      color: 'var(--text-main)'
                    }}
                  >
                    <span style={{ fontSize: '1.45rem', lineHeight: 1.05, color: 'var(--accent-purple)', fontWeight: 900, flexShrink: 0 }}>
                      •
                    </span>
                    <span>
                      Apply <strong style={{ fontWeight: 900, color: 'var(--text-main)' }}>AI, Data Analytics, IoT, and Software Engineering</strong> to societal challenges
                    </span>
                  </li>

                  <li
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      fontSize: '1.02rem',
                      lineHeight: 1.5,
                      fontWeight: 700,
                      color: 'var(--text-main)'
                    }}
                  >
                    <span style={{ fontSize: '1.45rem', lineHeight: 1.05, color: 'var(--primary)', fontWeight: 900, flexShrink: 0 }}>
                      •
                    </span>
                    <span>
                      Align student projects with <strong style={{ fontWeight: 900, color: 'var(--text-main)' }}>global sustainability goals</strong>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* EVENT SUMMARY EVALUATION BOX & RESULTS */}
        <div
          className="stic-card"
          style={{
            marginBottom: 0,
            border: '1px solid var(--border-highlight)'
          }}
        >
          <div className="card-header-bar" style={{ padding: '22px 28px', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'var(--primary-soft)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Target size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Event Summary Alignment &amp; Work Improvement Evaluator
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  Enter your event summary below and click &ldquo;Evaluate Summary&rdquo; to check accurate matching percentage with Club Vision &amp; Objectives
                </p>
              </div>
            </div>
          </div>

          <div className="card-body" style={{ padding: '28px 32px' }}>
            {/* Input Box (No Demo Summary) */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      marginBottom: '8px'
                    }}
                  >
                    Event / Program Title (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter the event or program title..."
                    value={eventTitleInput}
                    onChange={(e) => setEventTitleInput(e.target.value)}
                    style={{ fontSize: '0.92rem', padding: '12px 16px' }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      marginBottom: '8px'
                    }}
                  >
                    Event Summary Box <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    placeholder="Enter the summary of the event here..."
                    value={eventSummaryInput}
                    onChange={(e) => {
                      setEventSummaryInput(e.target.value);
                      if (evalError) setEvalError('');
                    }}
                    style={{
                      width: '100%',
                      fontSize: '0.94rem',
                      lineHeight: 1.6,
                      padding: '14px 16px',
                      borderRadius: '12px',
                      resize: 'vertical'
                    }}
                  />
                  {evalError && (
                    <div style={{ color: 'var(--accent-rose)', fontSize: '0.82rem', fontWeight: 600, marginTop: '8px' }}>
                      {evalError}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '18px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (!eventSummaryInput.trim()) {
                      setEvalError('Please enter an event summary in the box above before clicking Evaluate Summary.');
                      return;
                    }
                    setEvalError('');
                    const res = evaluateEventSummaryAlignment(eventSummaryInput);
                    setEvaluationResult(res);
                  }}
                  style={{
                    padding: '11px 24px',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(20, 184, 166, 0.35)'
                  }}
                >
                  <Sparkles size={16} />
                  Evaluate Summary
                </button>

                {evaluationResult && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setEventTitleInput('');
                      setEventSummaryInput('');
                      setEvaluationResult(null);
                      setEvalError('');
                    }}
                    style={{ padding: '11px 18px', fontSize: '0.86rem' }}
                  >
                    <RotateCcw size={15} />
                    Reset
                  </button>
                )}

                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginLeft: 'auto', fontWeight: 600 }}>
                  Evaluates how accurately the event summary matches the Club Vision and Club Objectives
                </span>
              </div>
            </div>

            {/* EVALUATION RESULTS: PIE CHART + PILLAR BREAKDOWN + 8 WORK IMPROVEMENT POINTS */}
            {evaluationResult && (
              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '24px',
                  borderTop: '1px solid var(--border-subtle)',
                  animation: 'fadeIn 0.35s ease'
                }}
              >
                {/* Top Row: Pie Chart + Pillar Accuracy Breakdown */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '22px',
                    marginBottom: '26px'
                  }}
                >
                  {/* PIE CHART CARD */}
                  <div
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '14px',
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          Vision &amp; Objectives Accuracy Pie Chart
                        </h4>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                          {eventTitleInput ? `Event: ${eventTitleInput}` : 'Evaluated Event Summary Match'}
                        </p>
                      </div>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 900,
                          padding: '5px 12px',
                          background: evaluationResult.overallMatchPct >= 75
                            ? 'var(--primary-soft)'
                            : evaluationResult.overallMatchPct >= 50
                            ? 'var(--accent-cyan-soft)'
                            : 'var(--accent-amber-soft)',
                          color: evaluationResult.overallMatchPct >= 75
                            ? 'var(--primary)'
                            : evaluationResult.overallMatchPct >= 50
                            ? 'var(--accent-cyan)'
                            : 'var(--accent-amber)',
                          border: '1px solid currentColor'
                        }}
                      >
                        {evaluationResult.overallMatchPct}% Matched
                      </span>
                    </div>

                    <div style={{ height: '240px', width: '100%', maxWidth: '320px', position: 'relative', margin: '8px auto' }}>
                      <Pie
                        data={{
                          labels: [
                            `Club Vision & Objectives Matched (${evaluationResult.overallMatchPct}%)`,
                            `Scope for Improvement (${evaluationResult.gapPct}%)`
                          ],
                          datasets: [
                            {
                              data: [evaluationResult.overallMatchPct, evaluationResult.gapPct],
                              backgroundColor: [
                                'rgba(13, 148, 136, 0.9)',
                                'rgba(244, 63, 94, 0.35)'
                              ],
                              borderColor: ['#0d9488', '#e11d48'],
                              borderWidth: 2,
                              hoverOffset: 6
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                color: '#64748b',
                                padding: 14,
                                font: { size: 12, weight: '700' },
                                usePointStyle: true
                              }
                            },
                            tooltip: {
                              backgroundColor: '#0f172a',
                              borderColor: 'rgba(45, 212, 191, 0.5)',
                              borderWidth: 1,
                              padding: 12,
                              callbacks: {
                                label: (ctx) => ` ${ctx.label}: ${ctx.raw}%`
                              }
                            }
                          }
                        }}
                      />
                    </div>

                    <div
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                        fontWeight: 800
                      }}
                    >
                      <span style={{ color: 'var(--primary)' }}>
                        • Accurate Alignment: {evaluationResult.overallMatchPct}%
                      </span>
                      <span style={{ color: 'var(--accent-rose)' }}>
                        • Improvement Needed: {evaluationResult.gapPct}%
                      </span>
                    </div>
                  </div>

                  {/* PILLAR-BY-PILLAR VISION & OBJECTIVES BREAKDOWN */}
                  <div
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '14px',
                      padding: '22px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Individual Vision &amp; Objectives Alignment Breakdown
                      </h4>
                      <p style={{ margin: '0 0 18px 0', fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        How accurately your event summary matches each STIC core mandate
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {evaluationResult.pillars.map((pillar, idx) => (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', fontSize: '0.8rem', fontWeight: 700 }}>
                              <span style={{ color: 'var(--text-main)' }}>• {pillar.label}</span>
                              <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{pillar.pct}%</span>
                            </div>
                            <div
                              style={{
                                width: '100%',
                                height: '8px',
                                background: 'var(--border-subtle)',
                                borderRadius: '999px',
                                overflow: 'hidden'
                              }}
                            >
                              <div
                                style={{
                                  width: `${pillar.pct}%`,
                                  height: '100%',
                                  background: pillar.color,
                                  borderRadius: '999px',
                                  transition: 'width 0.5s ease'
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '18px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'var(--primary-soft)',
                        border: '1px solid var(--border-highlight)',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.5,
                        fontWeight: 600
                      }}
                    >
                      <strong style={{ color: 'var(--primary)', fontWeight: 800 }}>Evaluator Insight:</strong> Follow the{' '}
                      <strong style={{ color: 'var(--text-main)', fontWeight: 800 }}>8 Event Work Improvement Points</strong> below to close the{' '}
                      <strong style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>{evaluationResult.gapPct}% gap</strong> and achieve near-100% alignment with CSE–STIC Vision &amp; Objectives.
                    </div>
                  </div>
                </div>

                {/* 8 POINTS OF EVENT WORK IMPROVEMENTS */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                      marginBottom: '16px',
                      padding: '12px 18px',
                      borderRadius: '10px',
                      background: 'var(--primary-soft)',
                      border: '1px solid var(--border-highlight)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Lightbulb size={20} style={{ color: 'var(--accent-amber)' }} />
                      <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 900, color: 'var(--text-main)' }}>
                        8 Actionable Work Improvement Points to Increase Match % &amp; Upgrade Event Execution
                      </h4>
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '0.74rem', fontWeight: 800, padding: '4px 10px' }}>
                      8 Complete Event Work Improvements
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: '16px'
                    }}
                  >
                    {evaluationResult.improvementPoints.map((pt) => (
                      <div
                        key={pt.number}
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '12px',
                          padding: '18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'var(--primary-soft)',
                                border: '1px solid var(--border-highlight)',
                                color: 'var(--primary)',
                                fontWeight: 900,
                                fontSize: '0.86rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              {pt.number}
                            </span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-cyan)' }}>
                              {pt.category}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: 'var(--accent-amber-soft)',
                              color: 'var(--accent-amber)',
                              border: '1px solid rgba(217, 119, 6, 0.35)'
                            }}
                          >
                            {pt.status}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.35 }}>
                          • {pt.title}
                        </div>

                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55, fontWeight: 500 }}>
                          {pt.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
