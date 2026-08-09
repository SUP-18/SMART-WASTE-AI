'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Award, Medal, Trophy, Users, Star, TrendingUp, Loader2 } from 'lucide-react';
import './leaderboard.css';
import { useAuth } from '@/context/AuthContext';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [stats, setStats] = useState({ totalCitizens: 0, totalResolved: 0, totalPoints: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setLeaders(data.leaders || (Array.isArray(data) ? data : []));
          if (data.stats) setStats(data.stats);
        } else {
          setLeaders([]);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setLeaders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [user]);

  const getBadgeCount = (points = 0) => {
    const thresholds = [100, 250, 500, 750, 1000, 1250, 1500];
    return thresholds.filter(t => points >= t).length;
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1: return <div className="rank-badge rank-gold"><Trophy size={20} /></div>;
      case 2: return <div className="rank-badge rank-silver"><Medal size={20} /></div>;
      case 3: return <div className="rank-badge rank-bronze"><Award size={20} /></div>;
      default: return <div className="rank-badge rank-standard">{rank}</div>;
    }
  };

  const totalCitizens = stats.totalCitizens || leaders.length;
  const totalResolved = stats.totalResolved || leaders.reduce((acc, curr) => acc + (curr.resolvedCount || curr.resolved || 0), 0);
  const totalPoints = stats.totalPoints || leaders.reduce((acc, curr) => acc + (curr.ecoPoints || curr.points || 0), 0);

  return (
    <div className="leaderboard-page pb-12">
      <Navbar />
      
      {/* Header */}
      <div className="bg-primary-dark text-white py-12 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4 flex justify-center items-center gap-3">
          <Trophy className="text-yellow-400" size={40} /> Community Leaderboard
        </h1>
        <p className="text-xl text-green-100 max-w-2xl mx-auto">
          Top citizens making a difference in our community through active participation and reporting.
        </p>
      </div>

      <div className="container -mt-8 relative z-10">
        {/* Top Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4 border border-gray-100">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex justify-center items-center">
              <Users size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Citizens</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalCitizens.toLocaleString()}</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4 border border-gray-100">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex justify-center items-center">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Issues Resolved</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalResolved.toLocaleString()}</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4 border border-gray-100">
            <div className="w-14 h-14 bg-yellow-100 text-yellow-600 rounded-full flex justify-center items-center">
              <Star size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Eco Points Awarded</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalPoints.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="grid grid-cols-12 bg-gray-50 p-4 border-b border-gray-200 text-gray-500 text-sm font-bold uppercase tracking-wider">
            <div className="col-span-2 md:col-span-1 text-center">Rank</div>
            <div className="col-span-6 md:col-span-5">Citizen</div>
            <div className="col-span-4 md:col-span-3 text-right md:text-left">Eco Points</div>
            <div className="col-span-0 md:col-span-3 hidden md:flex justify-end gap-8 pr-4">
              <span>Reports</span>
              <span>Resolved</span>
            </div>
          </div>
          
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="spin text-primary" size={40} />
            </div>
          ) : leaders.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No leaderboard data available.
            </div>
          ) : (
            <div className="leaderboard-list">
              {leaders.map((leader, index) => {
                const rank = index + 1;
                const initials = leader.name ? leader.name.split(' ').map(n => n[0]).join('') : '?';
                const isCurrentUser = user?.id !== undefined && user?.id !== null && String(leader.id) === String(user.id);
                const points = leader.ecoPoints ?? leader.points ?? 0;
                const reportsCount = leader.reportCount ?? leader.reports ?? 0;
                const resolvedCount = leader.resolvedCount ?? leader.resolved ?? 0;
                const badgesCount = getBadgeCount(points);
                
                return (
                  <div 
                    key={leader.id} 
                    className={`grid grid-cols-12 items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      isCurrentUser ? 'bg-green-50 hover:bg-green-100 border-green-200' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="col-span-2 md:col-span-1 flex justify-center">
                      {getRankBadge(rank)}
                    </div>
                    
                    <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex justify-center items-center text-sm font-bold shadow-sm ${
                        rank === 1 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : 
                        rank === 2 ? 'bg-gray-200 text-gray-700 border border-gray-300' :
                        rank === 3 ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-base md:text-lg">
                          {leader.name} {isCurrentUser && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full ml-2">YOU</span>}
                        </h4>
                        <div className="flex gap-1 mt-1 text-xs text-gray-500">
                          <Award size={14} className="text-yellow-500" /> {badgesCount} Badges
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-span-4 md:col-span-3 text-right md:text-left flex items-center md:justify-start justify-end gap-2">
                      <span className="text-xl font-black text-primary">{points}</span>
                      <span className="text-sm font-medium text-gray-500 hidden md:inline">pts</span>
                    </div>
                    
                    <div className="col-span-0 md:col-span-3 hidden md:flex justify-end gap-12 pr-6">
                      <div className="text-center w-12">
                        <span className="block font-bold text-gray-700">{reportsCount}</span>
                      </div>
                      <div className="text-center w-12">
                        <span className="block font-bold text-green-600">{resolvedCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
