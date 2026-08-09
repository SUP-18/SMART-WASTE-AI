'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, MapPin, Clock, Users, ShieldAlert, CheckCircle, 
  ThumbsUp, Share2, Info, Loader2, FileText
} from 'lucide-react';
import './report-detail.css';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function ReportDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuth();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
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
              upvotes: r.upvoteCount ?? 0,
              resolutionDate: r.resolvedAt,
              location: (r.latitude != null && r.longitude != null) 
                ? { lat: Number(r.latitude), lng: Number(r.longitude) } 
                : { lat: 28.6139, lng: 77.2090 }
            });
          } else {
            setReport(null);
          }
        } else {
          setReport(null);
        }
      } catch (error) {
        console.error('Failed to fetch report', error);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleUpvote = async () => {
    if (hasUpvoted || upvoting || !report) return;
    if (!user) {
      router.push('/login');
      return;
    }
    setUpvoting(true);
    try {
      const res = await fetch(`/api/reports/${report.id}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (res.ok && data.upvoted) {
        setReport(prev => ({
          ...prev,
          upvotes: data.newCount,
          upvoteCount: data.newCount
        }));
        setHasUpvoted(true);
      } else if (res.status === 400 || data.error === 'Already upvoted') {
        setHasUpvoted(true);
      }
    } catch (error) {
      console.error('Failed to upvote report', error);
    } finally {
      setUpvoting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container py-8 flex justify-center items-center h-64">
          <Loader2 className="spin text-primary" size={40} />
        </div>
      </div>
    );
  }

  if (!report) return <div>Report not found</div>;

  const dateStr = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
  
  const resolutionDateStr = report.resolutionDate 
    ? new Date(report.resolutionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'assigned': return 'bg-blue-500';
      case 'in progress': return 'bg-purple-500';
      case 'resolved': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="report-detail-page pb-12">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4 mb-6 sticky top-16 z-40">
        <div className="container flex justify-between items-center">
          <Link href="/my-reports" className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors">
            <ArrowLeft size={20} /> Back to My Reports
          </Link>
          <div className="flex gap-3">
            <span className="font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm">
              #{report.id}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${getStatusColor(report.status)}`}>
              {report.status}
            </span>
          </div>
        </div>
      </div>

      <div className="container">
        {report.status === 'Resolved' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-4">
            <CheckCircle className="text-green-600 shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-green-800 text-lg">Issue successfully resolved</h3>
              <p className="text-green-700 mt-1">This issue was resolved by the authorities on {resolutionDateStr}. You earned <strong>+10 Eco Points</strong>!</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              {report.status === 'Resolved' && report.afterImageUrl ? (
                <div className="flex flex-col md:flex-row h-auto md:h-96">
                  <div className="flex-1 relative bg-gray-50 flex items-center justify-center">
                    {!imgError && report.imageUrl ? (
                      <img 
                        src={report.imageUrl} 
                        alt="Before" 
                        className="w-full h-64 md:h-full object-cover" 
                        onError={(e) => {
                          const fallbacks = {
                            'Overflowing Bin': '/uploads/demo/overflowing_bin.jpg',
                            'Illegal Dumping': '/uploads/demo/illegal_dumping.jpg',
                            'Street Waste': '/uploads/demo/street_waste.jpg',
                            'Water Leakage': '/uploads/demo/water_leakage.jpg',
                            'Pothole': '/uploads/demo/pothole.jpg',
                            'Other': '/uploads/demo/street_light.jpg'
                          };
                          const fb = fallbacks[report.category] || '/uploads/demo/overflowing_bin.jpg';
                          if (e.target.src.includes(fb)) {
                            setImgError(true);
                          } else {
                            e.target.src = fb;
                          }
                        }} 
                      />
                    ) : (
                      <div className="text-center p-8 text-gray-400">
                        <div className="text-4xl mb-2">📷</div>
                        <div className="font-bold">Image unavailable</div>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded font-bold shadow-lg">
                      BEFORE
                    </div>
                  </div>
                  <div className="w-1 bg-white z-10 hidden md:block"></div>
                  <div className="flex-1 relative bg-gray-50 flex items-center justify-center">
                    {!afterImgError && report.afterImageUrl ? (
                      <img src={report.afterImageUrl} alt="After" className="w-full h-64 md:h-full object-cover" onError={() => setAfterImgError(true)} />
                    ) : (
                      <div className="text-center p-8 text-gray-400">
                        <div className="text-4xl mb-2">📷</div>
                        <div className="font-bold">Image unavailable</div>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded font-bold shadow-lg flex items-center gap-1">
                      <CheckCircle size={16} /> AFTER
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-auto max-h-[500px] min-h-[300px] bg-gray-50 flex items-center justify-center">
                  {!imgError && report.imageUrl ? (
                    <img 
                      src={report.imageUrl} 
                      alt="Issue" 
                      className="w-full h-auto max-h-[500px] object-cover" 
                      onError={(e) => {
                        const fallbacks = {
                          'Overflowing Bin': '/uploads/demo/overflowing_bin.jpg',
                          'Illegal Dumping': '/uploads/demo/illegal_dumping.jpg',
                          'Street Waste': '/uploads/demo/street_waste.jpg',
                          'Water Leakage': '/uploads/demo/water_leakage.jpg',
                          'Pothole': '/uploads/demo/pothole.jpg',
                          'Other': '/uploads/demo/street_light.jpg'
                        };
                        const fb = fallbacks[report.category] || '/uploads/demo/overflowing_bin.jpg';
                        if (e.target.src.includes(fb)) {
                          setImgError(true);
                        } else {
                          e.target.src = fb;
                        }
                      }} 
                    />
                  ) : (
                    <div className="text-center p-8 text-gray-400">
                      <div className="text-4xl mb-2">📷</div>
                      <div className="font-bold text-lg">Image unavailable</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold mb-4">Location</h2>
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="text-primary mt-1 shrink-0" />
                <p className="text-lg">{report.locationText}</p>
              </div>
              <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                <MapView position={report.location} readOnly={true} />
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Main Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl font-bold text-gray-900">{report.category}</h1>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-gray-50 p-2 rounded-lg inline-flex">
                <ShieldAlert size={16} className="text-primary" />
                <span>AI Confidence: {report.aiConfidence}%</span>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 text-gray-600">
                  <FileText className="shrink-0 mt-1" size={18} />
                  <p>{report.description}</p>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="shrink-0" size={18} />
                  <span>Reported on {dateStr}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Users className="shrink-0" size={18} />
                  <span>{report.peopleAffected} people affected</span>
                </div>
              </div>
            </div>

            {/* Priority Score */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
              <h3 className="font-bold text-gray-700 mb-4 text-left">Priority Score</h3>
              <div className="w-32 h-32 rounded-full border-8 border-orange-500 flex justify-center items-center mx-auto mb-4">
                <span className="text-4xl font-bold text-gray-800">{report.priorityScore}</span>
              </div>
              <p className="text-lg font-bold text-orange-600 mb-1">
                {report.priorityScore >= 80 ? 'High Priority' : report.priorityScore >= 50 ? 'Medium Priority' : 'Low Priority'}
              </p>
              <p className="text-sm text-gray-500">Based on location type and impact</p>
            </div>

            {/* Community Support */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">Community Support</h3>
                {report.upvotes > 10 && (
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                    🔥 Trending
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg text-blue-600 font-bold text-xl">
                  {report.upvotes}
                </div>
                <span className="text-gray-600">citizens affected by this</span>
              </div>
              
              <button 
                className={`w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-colors ${
                  hasUpvoted || report.status === 'Resolved'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-primary text-white hover:bg-green-700 shadow-md'
                }`}
                onClick={handleUpvote}
                disabled={hasUpvoted || upvoting || report.status === 'Resolved'}
              >
                {upvoting ? <Loader2 size={20} className="spin" /> : <ThumbsUp size={20} />}
                {hasUpvoted ? 'Supported' : report.status === 'Resolved' ? 'Resolved' : 'This affects me too'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
