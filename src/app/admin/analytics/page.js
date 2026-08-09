'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import styles from './analytics.module.css';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
);

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem' }}>Loading analytics dashboard...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>
      </AdminLayout>
    );
  }

  if (!analyticsData || !analyticsData.totalReports) {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem' }}>No analytics data available.</div>
      </AdminLayout>
    );
  }

  // --- Chart Data Setups ---
  
  // 1. Reports by Category (Doughnut)
  const categoryData = {
    labels: analyticsData.reportsByCategory?.map(c => c.category) || [],
    datasets: [
      {
        data: analyticsData.reportsByCategory?.map(c => c.count) || [],
        backgroundColor: [
          '#ef4444', // Red
          '#f59e0b', // Amber
          '#3b82f6', // Blue
          '#06b6d4', // Cyan
          '#8b5cf6', // Purple
          '#64748b', // Slate
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  // 2. Reports by Status (Bar)
  const statusData = {
    labels: analyticsData.reportsByStatus?.map(s => s.status) || [],
    datasets: [
      {
        label: 'Reports',
        data: analyticsData.reportsByStatus?.map(s => s.count) || [],
        backgroundColor: [
          '#f59e0b', // Amber
          '#3b82f6', // Blue
          '#f97316', // Orange
          '#16a34a', // Green
        ],
        borderRadius: 4,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  // 3. Reports Over Time (Line)
  const timeData = {
    labels: analyticsData.reportsOverTime?.map(t => t.date) || [],
    datasets: [
      {
        label: 'New Reports',
        data: analyticsData.reportsOverTime?.map(t => t.count) || [],
        fill: true,
        backgroundColor: 'rgba(34, 197, 94, 0.2)', // Green light
        borderColor: '#16a34a',
        tension: 0.4,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  // 4. Priority Distribution (Bar)
  const highPriority = analyticsData.highPriority || 0;
  const remainingPriority = (analyticsData.totalReports || 0) - highPriority;
  const mediumPriority = Math.floor(remainingPriority / 2);
  const lowPriority = Math.ceil(remainingPriority / 2);

  const priorityData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Priority Level',
        data: [highPriority, mediumPriority, lowPriority],
        backgroundColor: [
          '#ef4444', // Red
          '#f59e0b', // Amber
          '#16a34a', // Green
        ],
        borderRadius: 4,
      },
    ],
  };

  return (
    <AdminLayout>
      <div className={styles.header}>
        <h1>📊 Analytics Dashboard</h1>
      </div>

      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Most Reported Issue</div>
          <div className={styles.metricValue}>
            {analyticsData.mostReportedIssue ? `🗑️ ${analyticsData.mostReportedIssue.category} (${analyticsData.mostReportedIssue.percentage}%)` : 'N/A'}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Peak Reporting Time</div>
          <div className={styles.metricValue}>
            {analyticsData.peakReportingTime ? `🕕 ${analyticsData.peakReportingTime}` : 'N/A'}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Most Affected Area</div>
          <div className={styles.metricValue}>
            {analyticsData.mostAffectedArea ? `📍 ${analyticsData.mostAffectedArea.location} (${analyticsData.mostAffectedArea.count})` : 'N/A'}
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Avg Resolution Time</div>
          <div className={styles.metricValue}>
            {analyticsData.avgResolutionTime ? `⏱️ ${analyticsData.avgResolutionTime}` : 'N/A'}
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h2>Reports by Category</h2>
          <div className={styles.chartContainer}>
            <Doughnut data={categoryData} options={doughnutOptions} />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h2>Reports by Status</h2>
          <div className={styles.chartContainer}>
            <Bar data={statusData} options={barOptions} />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h2>Reports Over Time (Last 30 Days)</h2>
          <div className={styles.chartContainer}>
            <Line data={timeData} options={lineOptions} />
          </div>
        </div>

        <div className={styles.chartCard}>
          <h2>Priority Distribution</h2>
          <div className={styles.chartContainer}>
            <Bar data={priorityData} options={barOptions} />
          </div>
        </div>
      </div>

      <div className={styles.chartCard} style={{ marginBottom: '2rem' }}>
        <h2>Category Breakdown & Resolution Rates</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.statsTable}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Reports</th>
                <th>Percentage</th>
                <th>Resolution Rate</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.reportsByCategory && analyticsData.reportsByCategory.length > 0 ? (
                analyticsData.reportsByCategory.map((item, index) => (
                  <tr key={index}>
                    <td>{item.category}</td>
                    <td>{item.count}</td>
                    <td>{item.percentage}%</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className={styles.progressBarContainer}>
                          <div className={styles.progressBarFill} style={{ width: `${item.resolutionRate}%`, backgroundColor: '#16a34a' }}></div>
                        </div>
                        <span>{item.resolutionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '1rem' }}>
                    No category data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
