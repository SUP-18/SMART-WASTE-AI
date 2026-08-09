'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import ReportCard from '@/components/ReportCard';
import { FileText, Loader2 } from 'lucide-react';
import './my-reports.css';
import Link from 'next/link';

export default function MyReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports?userId=' + user.id);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Failed to fetch reports', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="spin text-primary" size={32} /></div>;
  if (!user) return null;

  const tabs = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved'];
  
  const filteredReports = activeTab === 'All' 
    ? reports 
    : reports.filter(r => r.status?.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="my-reports-page">
      <Navbar />
      <div className="container py-8">
        <div className="page-header flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
            <p className="text-secondary">Track the status of issues you've reported</p>
          </div>
          <Link href="/report" className="btn btn-primary">
            + New Report
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="tabs-container mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map(tab => (
              <button 
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                <span className="tab-count">
                  {tab === 'All' ? reports.length : reports.filter(r => r.status?.toLowerCase() === tab.toLowerCase()).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-img"></div>
                <div className="p-4">
                  <div className="skeleton-line h-6 w-3/4 mb-4"></div>
                  <div className="skeleton-line h-4 w-full mb-2"></div>
                  <div className="skeleton-line h-4 w-5/6 mb-4"></div>
                  <div className="flex gap-4">
                    <div className="skeleton-line h-4 w-1/4"></div>
                    <div className="skeleton-line h-4 w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredReports.map(report => (
              <ReportCard key={report.reportId || report.id} report={report} />
            ))}
          </div>
        ) : (
          <div className="empty-state text-center py-16 bg-white rounded-xl border border-gray-100">
            <FileText size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No reports found</h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'All' 
                ? "You haven't reported any issues yet." 
                : `You don't have any ${activeTab.toLowerCase()} reports.`}
            </p>
            {activeTab === 'All' && (
              <Link href="/report" className="btn btn-primary">
                Start by reporting an issue
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
