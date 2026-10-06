import React, { useState, useEffect } from 'react';
import { UserCheck, Award, CalendarDays, Mail, Phone, Building2, ChevronRight, Search } from 'lucide-react';
import { api } from '../api';

export default function CoordinatorsView({ showToast, onSelectProgram }) {
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const fetchCoordinators = async () => {
    try {
      setLoading(true);
      const res = await api.getCoordinators();
      setCoordinators(res.data || []);
    } catch (err) {
      showToast('error', 'Error fetching coordinators', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = coordinators.filter(c => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(term) ||
      c.college_id?.toLowerCase().includes(term) ||
      c.department_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-title-wrap">
          <h1>
            <UserCheck size={26} color="var(--primary-light)" />
            STIC Event Coordinators Directory
          </h1>
          <p>
            Comprehensive matrix tracking all programs coordinated by club leadership and student members
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <div className="filter-search-box">
          <Search size={16} className="search-icon-pos" />
          <input
            type="text"
            placeholder="Search coordinators by name, college ID, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px' }}>Loading coordinators matrix...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="stic-card" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-subtle)' }}>
          <UserCheck size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3>No Coordinators Found</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '22px' }}>
          {filtered.map((c) => (
            <div key={c.id} className="stic-card" style={{ marginBottom: 0 }}>
              <div className="card-header-bar" style={{ background: 'var(--bg-surface-elevated)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '68px', height: '68px', minWidth: '68px', minHeight: '68px', aspectRatio: '1 / 1', borderRadius: '50%', background: 'var(--primary-soft)', border: '3px solid var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary-light)', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)' }}>
                    {c.profile_photo ? (
                      <img src={c.profile_photo} alt={c.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : c.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{c.full_name}</h3>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>
                      {c.college_id} · {c.department_name || 'No Dept'}
                    </div>
                  </div>
                </div>

                <span className={`badge ${c.programs_count > 0 ? 'badge-success' : 'badge-neutral'}`}>
                  <Award size={12} /> {c.programs_count} Program(s)
                </span>
              </div>

              <div className="card-body">
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><span style={{ color: 'var(--text-subtle)' }}>Academic:</span> {c.year} ({c.branch})</div>
                  <div><span style={{ color: 'var(--text-subtle)' }}>Contact:</span> {c.email} {c.phone ? `· ${c.phone}` : ''}</div>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)', marginBottom: '6px' }}>
                    Coordinator Responsibilities
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45, display: 'flex', flexDirection: 'column', gap: '2px', fontWeight: 500 }}>
                    <li>Plan workshops, seminars and competitions</li>
                    <li>Coordinate venue, registrations & volunteers</li>
                    <li>Invite speakers and ensure smooth events</li>
                  </ul>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                    Coordinated Events
                  </div>

                  {c.programs && c.programs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {c.programs.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            padding: '10px 12px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s ease'
                          }}
                          onClick={() => onSelectProgram(p.id)}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                              {p.program_date} · {p.venue}
                            </div>
                          </div>
                          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            {p.role_title || 'Lead Coordinator'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                      Not currently assigned to coordinate any scheduled program.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
