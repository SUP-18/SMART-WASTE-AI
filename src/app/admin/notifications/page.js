'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import styles from './notifications.module.css';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function AdminNotifications() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] })
      });
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: 1 } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true, userId: user?.id })
      });
      setNotifications(notifications.map(n => ({ ...n, read: 1 })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const filteredNotifications = notifications.filter(n => 
    filter === 'All' ? true : !n.read
  );

  const getTypeFromMessage = (notification) => {
    const type = notification.type || '';
    if (type.includes('new_report')) return 'alert';
    if (type.includes('status') || type.includes('milestone')) return 'alert';
    if (type.includes('report_created') || type === 'success') return 'success';
    return 'info';
  };

  const getIcon = (type) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={20} />;
      case 'success': return <CheckCircle size={20} />;
      case 'info': default: return <Info size={20} />;
    }
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} minutes ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <AdminLayout>
      <div className={styles.header}>
        <h1><Bell size={24} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} /> Notifications</h1>
        <div className={styles.headerActions}>
          <select 
            className={styles.filterSelect}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Notifications</option>
            <option value="Unread">Unread Only</option>
          </select>
          <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
            Mark All as Read
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading notifications...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className={styles.emptyState}>
          <Bell size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
          <p>No notifications found.</p>
        </div>
      ) : (
        <div className={styles.notificationList}>
          {filteredNotifications.map((notification) => {
            const displayType = getTypeFromMessage(notification);
            return (
              <div key={notification.id} className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}>
                <div className={`${styles.iconWrapper} ${styles[displayType]}`}>
                  {getIcon(displayType)}
                </div>
                <div className={styles.content}>
                  <p className={styles.message}>{notification.message}</p>
                  <p className={styles.time}>{getTimeAgo(notification.createdAt)}</p>
                </div>
                {!notification.read && (
                  <button 
                    className={styles.actionBtn}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
