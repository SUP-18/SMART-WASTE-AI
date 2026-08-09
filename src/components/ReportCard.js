'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { MapPin, ThumbsUp, Users, Clock } from 'lucide-react';
import './reportCard.css';

const CATEGORY_FALLBACK_IMAGES = {
  'Overflowing Bin': '/uploads/demo/overflowing_bin.jpg',
  'Illegal Dumping': '/uploads/demo/illegal_dumping.jpg',
  'Street Waste': '/uploads/demo/street_waste.jpg',
  'Water Leakage': '/uploads/demo/water_leakage.jpg',
  'Pothole': '/uploads/demo/pothole.jpg',
  'Other': '/uploads/demo/street_light.jpg',
};

export default function ReportCard({ report }) {
  const { user } = useAuth();
  
  const categoryFallback = CATEGORY_FALLBACK_IMAGES[report.category] || CATEGORY_FALLBACK_IMAGES['Overflowing Bin'];

  const getInitialImage = () => {
    if (!report.imageUrl) return categoryFallback;
    if (report.imageUrl.endsWith('.svg') || report.imageUrl.includes('test.jpg') || report.imageUrl.includes('water leakage') || report.imageUrl.includes('overdumb')) {
      return categoryFallback;
    }
    return report.imageUrl;
  };

  const [currentImg, setCurrentImg] = useState(getInitialImage());
  const [hasFallbackTried, setHasFallbackTried] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleImgError = () => {
    if (!hasFallbackTried && currentImg !== categoryFallback) {
      setHasFallbackTried(true);
      setCurrentImg(categoryFallback);
    } else {
      setImgError(true);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const href = user?.role === 'admin' 
    ? `/admin/reports/${report.id}` 
    : `/report/${report.id}`;

  return (
    <Link href={href} className="report-card-link">
      <div className="report-card">
        <div className="report-card-image" style={{ backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          {!imgError ? (
            <img 
              src={currentImg} 
              alt={report.category} 
              onError={handleImgError} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Image unavailable</div>
            </div>
          )}
          <div className={`status-badge status-${(report.status || 'pending').toLowerCase().replace(/\s+/g, '')}`}>
            {report.status}
          </div>
        </div>

        <div className="report-card-content">
          <div className="report-card-header">
            <h3>{report.category}</h3>
            <span className="report-id">#{report.id}</span>
          </div>

          <div className="report-location">
            <MapPin size={14} />
            <span>{report.locationText || report.location || report.address || 'Unknown location'}</span>
          </div>

          <div className="report-badges">
            <PriorityBadge score={report.priorityScore} level={report.priorityLevel} />
          </div>

          <div className="report-card-footer">
            <div className="report-stats">
              <span className="stat" title="Upvotes">
                <ThumbsUp size={14} />
                {report.upvoteCount || 0}
              </span>
              <span className="stat" title="People Affected">
                <Users size={14} />
                {report.peopleAffected || 0}
              </span>
            </div>
            <div className="report-time">
              <Clock size={14} />
              {formatTimeAgo(report.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
