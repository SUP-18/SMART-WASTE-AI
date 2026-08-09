'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, FileText, MapPin, BarChart3, Bell, LogOut, User,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetch(`/api/notifications?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
        })
        .catch(err => console.error('Failed to fetch admin notifications', err));
    }
  }, [user, pathname]);

  const links = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Hotspots', href: '/admin/hotspots', icon: MapPin },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  ];

  return (
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="admin-sidebar-header">
        <Link href="/admin" className="admin-sidebar-brand">
          <span className="admin-sidebar-logo">♻️</span>
          {!isCollapsed && <span className="admin-sidebar-title">SmartWaste</span>}
        </Link>
        <button 
          className="admin-sidebar-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar-nav">
        {!isCollapsed && <span className="admin-sidebar-section-label">MAIN MENU</span>}
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
              title={isCollapsed ? link.name : undefined}
            >
              <div className="admin-sidebar-link-icon" style={{ position: 'relative' }}>
                <Icon size={20} />
                {link.name === 'Notifications' && unreadCount > 0 && isCollapsed && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                )}
              </div>
              {!isCollapsed && <span className="admin-sidebar-link-text">{link.name}</span>}
              {link.name === 'Notifications' && unreadCount > 0 && !isCollapsed && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>
                  {unreadCount}
                </span>
              )}
              {isActive && !isCollapsed && <div className="admin-sidebar-active-indicator" />}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="admin-sidebar-footer">
        {user && (
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
            </div>
            {!isCollapsed && (
              <div className="admin-sidebar-user-info">
                <span className="admin-sidebar-user-name">{user.name}</span>
                <span className="admin-sidebar-user-role">{user.role}</span>
              </div>
            )}
            <button 
              onClick={logout} 
              className="admin-sidebar-logout" 
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
