import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  CalendarDays,
  FileText,
  Image,
  Video,
  IndianRupee,
  HandCoins,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';

export default function SearchView({ searchQuery, setSearchQuery, setView, setSelectedProgramId }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);

  useEffect(() => {
    if (searchQuery && searchQuery.trim().length >= 2) {
      performSearch(searchQuery.trim());
    } else {
      setResults(null);
      setTotalMatches(0);
    }
  }, [searchQuery]);

  const performSearch = async (q) => {
    try {
      setLoading(true);
      const res = await api.search(q);
      setResults(res.results);
      setTotalMatches(res.total_matches || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Search Header */}
      <div className="page-header-row">
        <div className="page-title-wrap">
          <h1>
            <Search size={26} color="var(--primary-light)" />
            Universal STIC Intelligence Search
          </h1>
          <p>
            Instant search across Members, Programs, Documents, Finance, Photos, Videos, and Sponsors
          </p>
        </div>
      </div>

      {/* Primary Search Input */}
      <div className="stic-card" style={{ marginBottom: '24px' }}>
        <div className="card-body">
          <div className="search-input-wrap" style={{ maxWidth: '100%' }}>
            <Search size={20} className="search-icon-pos" />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '44px', fontSize: '1rem', height: '48px' }}
              placeholder="Search by keywords, roll numbers, speaker names, vendor invoices, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          {searchQuery && (
            <div style={{ marginTop: '10px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {loading ? 'Searching repository...' : `Found ${totalMatches} matching record(s) for "${searchQuery}"`}
            </div>
          )}
        </div>
      </div>

      {/* Results Groups */}
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* 1. Members */}
          {results.members?.length > 0 && (
            <div className="stic-card">
              <div className="card-header-bar">
                <h3><Users size={18} color="var(--primary-light)" /> Matching Club Members ({results.members.length})</h3>
                <button className="btn btn-outline btn-sm" onClick={() => setView('members')}>Go to Members</button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="stic-table">
                    <thead>
                      <tr><th>Name</th><th>College ID</th><th>Department</th><th>Position</th><th>Contact</th></tr>
                    </thead>
                    <tbody>
                      {results.members.map((m) => (
                        <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setView('members')}>
                          <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.full_name}</td>
                          <td style={{ fontFamily: 'monospace' }}>{m.college_id}</td>
                          <td><span className="badge badge-neutral">{m.department_name || 'Unassigned'}</span></td>
                          <td><span className="badge badge-info">{m.position}</span></td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. Programs */}
          {results.programs?.length > 0 && (
            <div className="stic-card">
              <div className="card-header-bar">
                <h3><CalendarDays size={18} color="var(--accent-cyan)" /> Matching Programs & Events ({results.programs.length})</h3>
                <button className="btn btn-outline btn-sm" onClick={() => setView('programs')}>All Programs</button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="stic-table">
                    <thead>
                      <tr><th>Code</th><th>Program Name</th><th>Date</th><th>Venue</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {results.programs.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-light)' }}>{p.program_code}</td>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td>{p.program_date}</td>
                          <td>{p.venue}</td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedProgramId(p.id);
                                setView('program-detail');
                              }}
                            >
                              Open Details <ChevronRight size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. Documents */}
          {results.documents?.length > 0 && (
            <div className="stic-card">
              <div className="card-header-bar">
                <h3><FileText size={18} color="#f59e0b" /> Matching Documents ({results.documents.length})</h3>
                <button className="btn btn-outline btn-sm" onClick={() => setView('documents')}>All Documents</button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="stic-table">
                    <thead>
                      <tr><th>Title</th><th>Category</th><th>Program</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {results.documents.map((d) => (
                        <tr key={d.id}>
                          <td style={{ fontWeight: 600 }}>{d.title}</td>
                          <td><span className="badge badge-info">{d.category}</span></td>
                          <td>{d.program_name || 'Global Club Document'}</td>
                          <td>
                            <a href={d.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                              Download
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. Transactions */}
          {results.transactions?.length > 0 && (
            <div className="stic-card">
              <div className="card-header-bar">
                <h3><IndianRupee size={18} color="#34d399" /> Matching Finance Transactions ({results.transactions.length})</h3>
                <button className="btn btn-outline btn-sm" onClick={() => setView('finance')}>Finance Ledger</button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="stic-table">
                    <thead>
                      <tr><th>Ref Code</th><th>Type</th><th>Category</th><th>Amount</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                      {results.transactions.map((t) => (
                        <tr key={t.id}>
                          <td style={{ fontFamily: 'monospace' }}>{t.transaction_code}</td>
                          <td><span className={`badge ${t.type === 'Income' ? 'badge-success' : 'badge-danger'}`}>{t.type}</span></td>
                          <td>{t.category}</td>
                          <td style={{ fontWeight: 700, color: t.type === 'Income' ? '#34d399' : '#fb7185' }}>₹{t.amount}</td>
                          <td style={{ fontSize: '0.82rem' }}>{t.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. Sponsors */}
          {results.sponsors?.length > 0 && (
            <div className="stic-card">
              <div className="card-header-bar">
                <h3><HandCoins size={18} color="#a855f7" /> Matching Sponsors ({results.sponsors.length})</h3>
                <button className="btn btn-outline btn-sm" onClick={() => setView('sponsors')}>All Sponsors</button>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="stic-table">
                    <thead>
                      <tr><th>Sponsor</th><th>Tier</th><th>Amount</th><th>Contact</th></tr>
                    </thead>
                    <tbody>
                      {results.sponsors.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600 }}>{s.sponsor_name}</td>
                          <td><span className="badge badge-info">{s.sponsorship_type}</span></td>
                          <td style={{ fontWeight: 700, color: '#34d399' }}>₹{s.amount}</td>
                          <td style={{ fontSize: '0.82rem' }}>{s.contact_person}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {totalMatches === 0 && (
            <div className="stic-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
              No matches found across any STIC entity for "{searchQuery}".
            </div>
          )}
        </div>
      )}
    </div>
  );
}
