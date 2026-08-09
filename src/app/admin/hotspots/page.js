'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import styles from './hotspots.module.css';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

// Dynamic import for Leaflet map to avoid SSR issues
// Replace this with your actual map component
const MapWithNoSSR = dynamic(
  () => import('@/components/MapView').then((mod) => mod.default),
  { 
    ssr: false, 
    loading: () => (
      <div className={styles.mapContainer} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
        <MapPin size={48} color="#94a3b8" />
        <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: 500 }}>Loading map data...</p>
      </div>
    )
  }
);

export default function AdminHotspots() {
  const [loading, setLoading] = useState(true);
  const [hotspots, setHotspots] = useState([]);
  const [summary, setSummary] = useState({ total: 0, highest: '', commonCategory: '' });

  useEffect(() => {
    const fetchHotspots = async () => {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const data = await res.json();
          const apiHotspots = data.hotspots || [];
          
          const formattedHotspots = apiHotspots.map((h, i) => {
            const level = h.count > 10 ? 'HIGH' : h.count > 5 ? 'MODERATE' : 'LOW';
            return {
              id: i + 1,
              area: h.locationText || 'Unknown Area',
              level,
              reportCount: h.count,
              commonCategory: h.topCategory || 'N/A',
              avgPriority: h.avgPriority ? `${Math.round(h.avgPriority)}` : 'N/A',
              resolutionRate: h.resolutionRate ? `${Math.round(h.resolutionRate)}%` : '0%'
            };
          });

          setHotspots(formattedHotspots);
          setSummary({
            total: formattedHotspots.length,
            highest: formattedHotspots.length > 0 ? `${formattedHotspots[0].area} (${formattedHotspots[0].reportCount})` : 'N/A',
            commonCategory: data.mostReportedIssue?.category || 'N/A'
          });
        }
      } catch (error) {
        console.error('Failed to fetch hotspots', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHotspots();
  }, []);

  const handleCardClick = (area) => {
    // Logic to filter map to this area
    console.log('Focusing on area:', area);
  };

  return (
    <AdminLayout>
      <div className={styles.header}>
        <h1>🗺️ Waste Hotspots</h1>
        <p>Areas with concentrated civic issues requiring immediate attention</p>
      </div>

      <div className={styles.mapContainer}>
        {/* Placeholder for map component until properly integrated with Leaflet */}
        <div style={{ width: '100%', height: '100%', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          <MapPin size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2 style={{ margin: 0, color: '#334155' }}>Interactive Map View</h2>
          <p style={{ color: '#64748b' }}>Showing {hotspots.length} hotspot clusters across the city</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.75rem', background: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>🔴 High (2)</span>
            <span style={{ fontSize: '0.75rem', background: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>🟡 Moderate (1)</span>
            <span style={{ fontSize: '0.75rem', background: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>🟢 Low (1)</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading hotspots data...</div>
      ) : (
        <>
          <div className={styles.statsSummary}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Hotspot Areas</span>
              <span className={styles.statValue}>{summary.total}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Highest Activity Area</span>
              <span className={styles.statValue}>{summary.highest}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Most Common Issue</span>
              <span className={styles.statValue}>{summary.commonCategory}</span>
            </div>
          </div>

          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Hotspot Analysis</h2>
          <div className={styles.hotspotList}>
            {hotspots.map((hotspot) => {
              let indicatorClass = styles.indicatorLow;
              if (hotspot.level === 'HIGH') indicatorClass = styles.indicatorHigh;
              else if (hotspot.level === 'MODERATE') indicatorClass = styles.indicatorMod;

              return (
                <div 
                  key={hotspot.id} 
                  className={styles.hotspotCard}
                  onClick={() => handleCardClick(hotspot.area)}
                >
                  <div className={styles.cardHeader}>
                    <h3 className={styles.areaName}>{hotspot.area}</h3>
                    <span className={`${styles.activityIndicator} ${indicatorClass}`}>
                      {hotspot.level}
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.dataPoint}>
                      <span className={styles.dataLabel}>Total Reports</span>
                      <span className={styles.dataValue}>{hotspot.reportCount}</span>
                    </div>
                    <div className={styles.dataPoint}>
                      <span className={styles.dataLabel}>Top Issue</span>
                      <span className={styles.dataValue}>{hotspot.commonCategory}</span>
                    </div>
                    <div className={styles.dataPoint}>
                      <span className={styles.dataLabel}>Avg Priority</span>
                      <span className={styles.dataValue}>{hotspot.avgPriority}</span>
                    </div>
                    <div className={styles.dataPoint}>
                      <span className={styles.dataLabel}>Resolution Rate</span>
                      <span className={styles.dataValue}>{hotspot.resolutionRate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
