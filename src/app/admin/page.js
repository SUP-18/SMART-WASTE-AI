'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import styles from './admin.module.css';
import { FileText, Clock, Loader, CheckCircle, AlertTriangle, ChevronRight, Eye } from 'lucide-react';

function getCategoryIcon(category) {
  switch (category) {
    case 'Overflowing Bin':
      return '🗑️';
    case 'Pothole':
      return '🕳️';
    case 'Illegal Dumping':
      return '⛔';
    case 'Water Leakage':
      return '💧';
    case 'Broken Streetlight':
    case 'Broken Street Light':
      return '💡';
    case 'Damaged Road':
      return '🛣️';
    case 'Street Waste':
      return '🧹';
    default:
      return '📝';
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats
        const statsRes = await fetch('/api/analytics');
        const statsData = await statsRes.json();
        
        // Fetch recent reports
        const reportsRes = await fetch('/api/reports?sort=newest&limit=8');
        const reportsData = await reportsRes.json();
        
        setStats(statsData);
        setReports(reportsData.reports || []);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem' }}>Loading dashboard...</div>
      </AdminLayout>
    );
  }

  const totalReports = stats?.totalReports || 0;
  const resolvedCount = stats?.resolved || 0;
  const pendingCount = stats?.pending || 0;
  const inProgressCount = stats?.inProgress || 0;

  const resolvedPercent = totalReports > 0 ? (resolvedCount / totalReports * 100) + '%' : '0%';
  const pendingPercent = totalReports > 0 ? (pendingCount / totalReports * 100) + '%' : '0%';
  const inProgressPercent = totalReports > 0 ? (inProgressCount / totalReports * 100) + '%' : '0%';

  return (
    <AdminLayout>
      <div className={styles.dashboardGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.blue}`}>
            <FileText size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Reports</h3>
            <p>{stats?.totalReports ?? 0}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.yellow}`}>
            <Clock size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>Pending</h3>
            <p>{stats?.pending ?? 0}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.orange}`}>
            <Loader size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>In Progress</h3>
            <p>{stats?.inProgress ?? 0}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.green}`}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>Resolved</h3>
            <p>{stats?.resolved ?? 0}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.red}`}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.statInfo}>
            <h3>High Priority</h3>
            <p>{stats?.highPriority ?? 0}</p>
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <Link href="/admin/reports" className={styles.actionButton}>
          View All Reports <ChevronRight size={16} />
        </Link>
        <Link href="/admin/hotspots" className={`${styles.actionButton} ${styles.secondary}`}>
          View Hotspots
        </Link>
        <Link href="/admin/analytics" className={`${styles.actionButton} ${styles.secondary}`}>
          View Analytics
        </Link>
      </div>

      <div className={styles.tableSection}>
        <h2>Recent Reports</h2>
        <table className={styles.reportsTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Location</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                  No recent reports found.
                </td>
              </tr>
            ) : (
              reports.map((report) => {
                const repId = report.id || report.reportId;
                const repPriority = report.priority || report.priorityLevel || 'Low';
                const repLocation = report.location || report.locationText;
                const repDate = report.date || report.createdAt;
                const repIcon = report.icon || getCategoryIcon(report.category);
                
                return (
                  <tr key={repId}>
                    <td data-label="ID">{repId}</td>
                    <td data-label="Category">{repIcon} {report.category}</td>
                    <td data-label="Location">{repLocation}</td>
                    <td data-label="Priority">
                      <span className={`${styles.badge} ${styles[repPriority.toLowerCase()]}`}>
                        {repPriority}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={`${styles.badge} ${styles[(report.status || 'Pending').replace(' ', '').toLowerCase()]}`}>
                        {report.status || 'Pending'}
                      </span>
                    </td>
                    <td data-label="Date">{new Date(repDate).toLocaleDateString()}</td>
                    <td data-label="Actions">
                      <Link href={`/admin/reports/${repId}`} className={styles.actionButton} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.overviewCards}>
        <div className={styles.overviewCard}>
          <h3>Reports by Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Resolved ({resolvedCount})</span>
              <div style={{ background: '#e2e8f0', width: '60%', height: '8px', borderRadius: '4px', alignSelf: 'center' }}>
                <div style={{ background: '#16a34a', width: resolvedPercent, height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pending ({pendingCount})</span>
              <div style={{ background: '#e2e8f0', width: '60%', height: '8px', borderRadius: '4px', alignSelf: 'center' }}>
                <div style={{ background: '#f59e0b', width: pendingPercent, height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>In Progress ({inProgressCount})</span>
              <div style={{ background: '#e2e8f0', width: '60%', height: '8px', borderRadius: '4px', alignSelf: 'center' }}>
                <div style={{ background: '#f97316', width: inProgressPercent, height: '100%', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.overviewCard}>
          <h3>Most Reported Category</h3>
          {stats?.mostReportedIssue ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem' }}>{getCategoryIcon(stats.mostReportedIssue.category)}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{stats.mostReportedIssue.category}</div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {stats.mostReportedIssue.count} reports ({stats.mostReportedIssue.percentage}%)
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-secondary)' }}>
              No data available
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

