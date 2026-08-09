'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import styles from './detail.module.css';
import adminStyles from '../../admin.module.css';
import { ArrowLeft, MapPin, Calendar, User, Info, Check, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import map to avoid SSR issues
const MapWithNoSSR = dynamic(
  () => import('@/components/MapView').then((mod) => mod.default),
  { ssr: false, loading: () => <div className={styles.mapContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>Loading Map...</div> }
);

export default function AdminReportDetail({ params }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Action states
  const [assignee, setAssignee] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [resolutionImage, setResolutionImage] = useState(null);

  const [imgError, setImgError] = useState(false);
  const [afterImgError, setAfterImgError] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/reports/' + id);
        if (res.ok) {
          const data = await res.json();
          if (data.report) {
            const r = data.report;
            setReport({
              ...r,
              reporter: r.reporterName || `User ${r.userId}`,
              icon: '📋',
              coordinates: (r.latitude != null && r.longitude != null) ? [r.latitude, r.longitude] : [28.6139, 77.2090],
              priority: r.priorityLevel || 'Medium',
              assignedTo: r.assignedTo || '',
              upvotes: r.upvoteCount || 0,
              date: r.createdAt,
              affectedPeople: r.peopleAffected,
              location: r.locationText
            });
            setNewStatus(r.status);
            setAssignee(r.assignedTo || '');
          }
        }
      } catch (error) {
        console.error('Failed to fetch report', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignee) return;
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: assignee, status: report.status === 'Pending' ? 'Assigned' : report.status })
      });
      if (res.ok) {
        const data = await res.json();
        setReport(prev => ({ ...prev, assignedTo: assignee, status: data.report.status }));
        setNewStatus(data.report.status);
        alert(`Successfully assigned to ${assignee}. User notified!`);
      } else {
        alert('Failed to update assignment');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating assignment');
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setReport(prev => ({ ...prev, status: data.report.status }));
        alert(`Status updated to ${newStatus}. User notified!`);
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  const handleFlag = async () => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagged: true })
      });
      if (res.ok) {
        alert('Report flagged for verification. User notified!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const statuses = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
  const getStatusIndex = (status) => statuses.indexOf(status);

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem' }}>Loading report details...</div>
      </AdminLayout>
    );
  }

  if (!report) {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Report not found.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/admin/reports" className={styles.backButton}>
            <ArrowLeft size={20} /> Back
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Report {report.id}</h1>
        </div>
        <div className={styles.badges}>
          <span className={`${adminStyles.badge} ${adminStyles[report.priority.toLowerCase()]}`}>
            Priority: {report.priority}
          </span>
          <span className={`${adminStyles.badge} ${adminStyles[report.status.replace(' ', '').toLowerCase()]}`}>
            Status: {report.status}
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <h2>Status Timeline</h2>
        <div className={styles.timeline}>
          {statuses.map((s, index) => {
            const currentIdx = getStatusIndex(report.status);
            let stateClass = '';
            if (index < currentIdx) stateClass = styles.completed;
            else if (index === currentIdx) stateClass = styles.active;
            
            return (
              <div key={s} className={`${styles.timelineStep} ${stateClass}`}>
                <div className={styles.timelineDot}>
                  {index < currentIdx ? <Check size={16} /> : index + 1}
                </div>
                <div className={styles.timelineLabel}>{s}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.twoColumnLayout}>
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <h2>Report Evidence</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Original Report Image</h3>
                <div className={styles.imageContainer} style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!imgError && report.imageUrl ? (
                    <img src={report.imageUrl} alt="Report evidence" onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                      <div style={{ fontWeight: 'bold' }}>Image unavailable</div>
                    </div>
                  )}
                </div>
              </div>

              {report.status === 'Resolved' && report.afterImageUrl && (
                <div>
                  <h3 style={{ fontSize: '0.875rem', color: '#16a34a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={14} /> Resolution Image
                  </h3>
                  <div className={styles.imageContainer} style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #16a34a' }}>
                    {!afterImgError ? (
                      <img src={report.afterImageUrl} alt="Resolution evidence" onError={() => setAfterImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                        <div style={{ fontWeight: 'bold' }}>Image unavailable</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <h3 style={{ fontSize: '1rem', marginTop: '1.5rem', marginBottom: '1rem' }}>Location Map</h3>
            <div className={styles.mapContainer}>
              {/* Fallback component since real map needs react-leaflet setup which might be missing */}
              <div style={{ width: '100%', height: '100%', background: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={32} color="#16a34a" />
                <p style={{ marginTop: '0.5rem', fontWeight: 500 }}>{report.location}</p>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{report.coordinates[0]}, {report.coordinates[1]}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.card}>
            <h2>Details</h2>
            
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}><User size={16} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }}/> Reporter</div>
              <div className={styles.detailValue}>{report.reporter}</div>
            </div>
            
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}><Info size={16} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }}/> Category</div>
              <div className={styles.detailValue}>{report.icon} {report.category}</div>
            </div>
            
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}><MapPin size={16} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }}/> Location</div>
              <div className={styles.detailValue}>{report.location}</div>
            </div>
            
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}><Calendar size={16} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }}/> Reported On</div>
              <div className={styles.detailValue}>{new Date(report.date).toLocaleString()}</div>
            </div>
            
            <div className={styles.detailRow} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className={styles.detailLabel} style={{ marginBottom: '0.5rem', width: '100%' }}>Description</div>
              <div className={styles.detailValue} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', width: '100%', border: '1px solid #e2e8f0', lineHeight: 1.5 }}>
                {report.description}
              </div>
            </div>
            
            <div className={styles.detailRow} style={{ marginTop: '1rem' }}>
              <div className={styles.detailLabel}>Community Impact</div>
              <div className={styles.detailValue}>
                👥 {report.upvotes} upvotes {report.upvotes > 10 ? '🔥' : ''}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Priority Analysis</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div className={`${styles.scoreCircle} ${report.priorityScore > 80 ? styles.scoreHigh : report.priorityScore > 50 ? styles.scoreMedium : styles.scoreLow}`}>
                {report.priorityScore}
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1a1a2e' }}>{report.priority} Priority</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  AI Confidence: {report.aiConfidence}%<br/>
                  Estimated {report.affectedPeople} people affected daily in this zone.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Admin Actions</h2>
            
            <form onSubmit={handleAssign} className={styles.actionFormGroup}>
              <label>Assign to Team/Worker</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Sanitation Dept - Team A" 
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                />
                <button type="submit" className={styles.button} style={{ width: 'auto', padding: '0 1.5rem' }}>
                  Assign
                </button>
              </div>
            </form>

            <form onSubmit={handleStatusUpdate} className={styles.actionFormGroup} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
              <label>Update Status</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  className={styles.input}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button type="submit" className={styles.button} style={{ width: 'auto', padding: '0 1.5rem' }}>
                  Update
                </button>
              </div>
            </form>
            
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
              <button onClick={handleFlag} className={`${styles.button} ${styles.warning}`}>
                <AlertTriangle size={18} /> Flag for Verification
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
