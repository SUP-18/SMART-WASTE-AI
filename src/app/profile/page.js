'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Award, Leaf, Camera, Users, CheckCircle, TrendingUp, Loader2 } from 'lucide-react';
import './profile.css';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.id) {
      async function fetchUserStats() {
        try {
          setLoading(true);
          const response = await fetch('/api/reports?userId=' + user.id);
          if (response.ok) {
            const data = await response.json();
            const userReports = data.reports || [];
            const totalReports = data.total ?? userReports.length;
            const resolvedReports = userReports.filter(r => r.status === 'Resolved').length;
            const upvotesReceived = userReports.reduce((sum, r) => sum + (r.upvoteCount || 0), 0);

            setStats({
              ecoPoints: user.ecoPoints || 0,
              totalReports,
              resolvedReports,
              upvotesReceived,
              upvotesGiven: 0,
              memberSince: user.createdAt || new Date().toISOString()
            });
          } else {
            setStats({
              ecoPoints: user.ecoPoints || 0,
              totalReports: 0,
              resolvedReports: 0,
              upvotesReceived: 0,
              upvotesGiven: 0,
              memberSince: user.createdAt || new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Fetch profile stats error:', error);
          setStats({
            ecoPoints: user.ecoPoints || 0,
            totalReports: 0,
            resolvedReports: 0,
            upvotesReceived: 0,
            upvotesGiven: 0,
            memberSince: user.createdAt || new Date().toISOString()
          });
        } finally {
          setLoading(false);
        }
      }
      fetchUserStats();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="spin text-primary" size={40} />
        </div>
      </div>
    );
  }

  if (!user || !stats) return null;

  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('') : user.email[0].toUpperCase();
  const parsedDate = stats.memberSince ? new Date(stats.memberSince) : new Date();
  const dateStr = !isNaN(parsedDate)
    ? parsedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  // Calculate next milestone (e.g., 250 points)
  const nextMilestone = 250;
  const progressPercent = Math.min(100, (stats.ecoPoints / nextMilestone) * 100);

  const badges = [
    { id: 'first_report', name: 'First Report', icon: <Camera size={24}/>, desc: 'Submitted 1+ report', earned: stats.totalReports >= 1, color: 'bg-blue-100 text-blue-600' },
    { id: 'green_citizen', name: 'Green Citizen', icon: <Leaf size={24}/>, desc: 'Earned 100+ points', earned: stats.ecoPoints >= 100, color: 'bg-green-100 text-green-600' },
    { id: 'supporter', name: 'Supporter', icon: <Users size={24}/>, desc: 'Gave 5+ upvotes', earned: stats.upvotesGiven >= 5, color: 'bg-purple-100 text-purple-600' },
    { id: 'trending', name: 'Trending', icon: <TrendingUp size={24}/>, desc: 'Report reached 10+ upvotes', earned: stats.upvotesReceived >= 10, color: 'bg-red-100 text-red-600' },
    { id: 'community_champ', name: 'Champion', icon: <Award size={24}/>, desc: 'Earned 250+ points', earned: stats.ecoPoints >= 250, color: 'bg-yellow-100 text-yellow-600' },
    { id: 'eco_hero', name: 'Eco Hero', icon: <CheckCircle size={24}/>, desc: 'Earned 500+ points', earned: stats.ecoPoints >= 500, color: 'bg-emerald-100 text-emerald-600' },
  ];

  return (
    <div className="profile-page pb-12">
      <Navbar />
      
      <div className="bg-primary pt-12 pb-24 px-4 text-center">
        <div className="avatar-circle mx-auto mb-4 bg-white text-primary text-4xl font-bold shadow-lg">
          {initials}
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">{user.name || 'Citizen'}</h1>
        <p className="text-green-100 mb-2">{user.email}</p>
        <p className="text-sm text-green-200">Member since {dateStr}</p>
      </div>

      <div className="container -mt-16">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Eco Score Card */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Leaf size={100} />
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Award className="text-yellow-500" /> Eco Score
              </h2>
              
              <div className="flex items-end gap-3 mb-6">
                <span className="text-5xl font-bold text-primary">{stats.ecoPoints}</span>
                <span className="text-lg text-gray-500 font-medium mb-1">Points</span>
              </div>
              
              <div className="mb-2 flex justify-between text-sm font-medium">
                <span className="text-gray-600">Level: Green Citizen</span>
                <span className="text-gray-500">{stats.ecoPoints} / {nextMilestone} to Champion</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center border-t border-gray-100 pt-6">
                <div>
                  <div className="text-sm text-gray-500">Verified Reports</div>
                  <div className="font-bold text-gray-800">+20 pts</div>
                </div>
                <div className="border-l border-r border-gray-100">
                  <div className="text-sm text-gray-500">Upvotes</div>
                  <div className="font-bold text-gray-800">+5 pts</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Resolved</div>
                  <div className="font-bold text-gray-800">+10 pts</div>
                </div>
              </div>
            </div>
            
            {/* Badges */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Achievements & Badges</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {badges.map(badge => (
                  <div key={badge.id} className={`badge-card ${badge.earned ? 'earned' : 'unearned'}`}>
                    <div className={`badge-icon-wrapper ${badge.earned ? badge.color : 'bg-gray-100 text-gray-400'}`}>
                      {badge.icon}
                    </div>
                    <h4 className={`font-bold mt-3 mb-1 text-sm ${badge.earned ? 'text-gray-800' : 'text-gray-400'}`}>
                      {badge.name}
                    </h4>
                    <p className="text-xs text-gray-500 text-center">{badge.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column - Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Impact Stats</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Camera size={18} className="text-blue-500" /> Total Reports
                  </div>
                  <span className="font-bold text-lg">{stats.totalReports}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3 text-green-800">
                    <CheckCircle size={18} className="text-green-600" /> Resolved Issues
                  </div>
                  <span className="font-bold text-lg text-green-700">{stats.resolvedReports}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 text-gray-700">
                    <TrendingUp size={18} className="text-orange-500" /> Upvotes Received
                  </div>
                  <span className="font-bold text-lg">{stats.upvotesReceived}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Users size={18} className="text-purple-500" /> Community Support
                  </div>
                  <span className="font-bold text-lg">{stats.upvotesGiven}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
