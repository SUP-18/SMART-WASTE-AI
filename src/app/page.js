'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { 
  Camera, Cpu, TrendingUp, Users, CheckCircle, ShieldCheck, 
  ArrowRight, FileText, Activity 
} from 'lucide-react';
import './home.css';

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    reports: 0,
    resolved: 0,
    hotspots: 0,
    citizens: 0
  });

  const [targetStats, setTargetStats] = useState({
    reports: 128,
    resolved: 73,
    hotspots: 12,
    citizens: 340
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [analyticsRes, leaderboardRes] = await Promise.all([
          fetch('/api/analytics'),
          fetch('/api/leaderboard')
        ]);
        
        const analytics = await analyticsRes.json();
        const leaderboard = await leaderboardRes.json();
        
        setTargetStats({
          reports: analytics.totalReports || 0,
          resolved: analytics.resolved || 0,
          hotspots: analytics.reportsByStatus?.length || 0, // proxy for hotspots
          citizens: leaderboard.stats?.totalCitizens || 1
        });
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    // Animate stats counter
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setStats(targetStats);
        clearInterval(timer);
      } else {
        const progress = currentStep / steps;
        setStats({
          reports: Math.floor(targetStats.reports * progress),
          resolved: Math.floor(targetStats.resolved * progress),
          hotspots: Math.floor(targetStats.hotspots * progress),
          citizens: Math.floor(targetStats.citizens * progress)
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [targetStats]);

  const steps = [
    { icon: <Camera size={24} />, title: '1. Report', desc: 'Snap a photo and describe the issue' },
    { icon: <Cpu size={24} />, title: '2. Detect', desc: 'AI identifies the problem category' },
    { icon: <TrendingUp size={24} />, title: '3. Prioritize', desc: 'Smart scoring ranks urgency' },
    { icon: <Users size={24} />, title: '4. Community', desc: 'Citizens support important issues' },
    { icon: <CheckCircle size={24} />, title: '5. Resolve', desc: 'Authorities take action' },
    { icon: <ShieldCheck size={24} />, title: '6. Verify', desc: 'Before & after proof of resolution' },
  ];

  return (
    <div className="home-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Report. Track. <span className="text-primary">Resolve.</span></h1>
            <h2 className="hero-subtitle">Build a Cleaner Community.</h2>
            <p className="hero-desc">
              SmartWaste connects citizens with local authorities to identify, prioritize and resolve civic problems faster.
            </p>
            <div className="hero-buttons">
              {user ? (
                <>
                  <Link href="/report" className="btn btn-primary btn-large">
                    Report an Issue
                  </Link>
                  <Link href="/my-reports" className="btn btn-outline btn-large">
                    Track My Reports
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-primary btn-large">
                    Login
                  </Link>
                  <Link href="/login?tab=register" className="btn btn-outline btn-large">
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hero-visual">
            <div className="abstract-shape shape-1"></div>
            <div className="abstract-shape shape-2"></div>
            <div className="abstract-shape shape-3"></div>
            <div className="floating-card card-1">
              <Camera size={20} className="text-primary" />
              <span>Issue Detected</span>
            </div>
            <div className="floating-card card-2">
              <CheckCircle size={20} className="text-success" />
              <span>Resolved</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <FileText size={32} className="stat-icon" />
              <div className="stat-value">{stats.reports}</div>
              <div className="stat-label">Reports Submitted</div>
            </div>
            <div className="stat-card">
              <CheckCircle size={32} className="stat-icon" />
              <div className="stat-value">{stats.resolved}</div>
              <div className="stat-label">Issues Resolved</div>
            </div>
            <div className="stat-card">
              <Activity size={32} className="stat-icon" />
              <div className="stat-value">{stats.hotspots}</div>
              <div className="stat-label">Active Hotspots</div>
            </div>
            <div className="stat-card">
              <Users size={32} className="stat-icon" />
              <div className="stat-value">{stats.citizens}</div>
              <div className="stat-label">Citizens Participating</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How SmartWaste Works</h2>
            <p>Six simple steps to a cleaner city</p>
          </div>
          
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div className="step-card" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="step-icon-wrapper">
                  {step.icon}
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container cta-container">
          <h2>Ready to make a difference?</h2>
          <p>Join hundreds of citizens improving our community today.</p>
          <Link href="/report" className="btn btn-primary btn-large cta-btn">
            Report an Issue Now <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <Camera size={24} className="text-primary" />
              <span>SmartWaste</span>
            </div>
            <p>Report. Track. Resolve.</p>
          </div>
          <div className="footer-links">
            <Link href="/about">About</Link>
            <Link href="/how-it-works">How It Works</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 SmartWaste. Built for a cleaner tomorrow.</p>
        </div>
      </footer>
    </div>
  );
}
