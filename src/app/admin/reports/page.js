'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import styles from './reports.module.css';
import adminStyles from '../admin.module.css';
import { Eye, Search, Filter, Trash2 } from 'lucide-react';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  useEffect(() => {
    async function fetchReports() {
      try {
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append('search', searchTerm);
        if (statusFilter !== 'All') queryParams.append('status', statusFilter);
        if (categoryFilter !== 'All') queryParams.append('category', categoryFilter);
        if (priorityFilter !== 'All') queryParams.append('priority', priorityFilter);
        
        const res = await fetch(`/api/reports?${queryParams.toString()}`);
        const data = await res.json();
        
        // Use real data or empty array
        setReports(data.reports || []);
      } catch (error) {
        console.error('Error fetching reports', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [searchTerm, statusFilter, categoryFilter, priorityFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setPriorityFilter('All');
  };

  const handleDelete = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
      } else {
        alert('Failed to delete report');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting report');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Overflowing Bin': return '🗑️';
      case 'Illegal Dumping': return '⛔';
      case 'Street Waste': return '🍂';
      case 'Water Leakage': return '💧';
      case 'Pothole': return '🕳️';
      default: return '📝';
    }
  };

  return (
    <AdminLayout>
      <div className={styles.header}>
        <h1>All Reports <span className={styles.countBadge}>{reports.length}</span></h1>
      </div>

      <div className={styles.filtersBar}>
        <div style={{ display: 'flex', flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Search reports..." 
            className={styles.searchInput}
            style={{ paddingLeft: '35px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        
        <select 
          className={styles.filterSelect}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Overflowing Bin">Overflowing Bin</option>
          <option value="Illegal Dumping">Illegal Dumping</option>
          <option value="Street Waste">Street Waste</option>
          <option value="Water Leakage">Water Leakage</option>
          <option value="Pothole">Pothole</option>
          <option value="Other">Other</option>
        </select>
        
        <select 
          className={styles.filterSelect}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        
        <button className={styles.clearButton} onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      <div className={adminStyles.tableSection}>
        {loading ? (
          <div>Loading reports...</div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No reports found matching your filters.
          </div>
        ) : (
          <table className={adminStyles.reportsTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Reporter</th>
                <th>Category</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Upvotes</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td data-label="ID">{report.reportId || report.id}</td>
                  <td data-label="Reporter">{report.reporterName || 'Citizen'}</td>
                  <td data-label="Category">{getCategoryIcon(report.category)} {report.category}</td>
                  <td data-label="Location">{report.locationText}</td>
                  <td data-label="Priority">
                    <span className={`${adminStyles.badge} ${adminStyles[(report.priorityLevel || 'Low').toLowerCase()]}`}>
                      {report.priorityScore || 0} - {report.priorityLevel || 'Low'}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span className={`${adminStyles.badge} ${adminStyles[(report.status || 'Pending').replace(' ', '').toLowerCase()]}`}>
                      {report.status || 'Pending'}
                    </span>
                  </td>
                  <td data-label="Upvotes">👍 {report.upvoteCount || 0}</td>
                  <td data-label="Date">{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link href={`/admin/reports/${report.id}`} className={adminStyles.actionButton} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        <Eye size={14} /> View
                      </Link>
                      <button 
                        onClick={() => handleDelete(report.id)} 
                        className={adminStyles.actionButton}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#ef4444', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
