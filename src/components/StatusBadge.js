'use client';

export default function StatusBadge({ status }) {
  const getStatusClass = (s) => {
    switch (s?.toLowerCase()) {
      case 'pending': return 'badge-warning';
      case 'assigned': return 'badge-info';
      case 'in progress': return 'badge-orange';
      case 'resolved': return 'badge-success';
      default: return 'badge-default';
    }
  };

  return (
    <span className={`badge ${getStatusClass(status)}`}>
      {status || 'Unknown'}
    </span>
  );
}
