'use client';

export default function PriorityBadge({ score, level }) {
  const getPriorityClass = (l) => {
    switch (l?.toLowerCase()) {
      case 'low': return 'priority-low';
      case 'medium': return 'priority-medium';
      case 'high': return 'priority-high pulse';
      default: return 'priority-default';
    }
  };

  return (
    <div className={`priority-badge ${getPriorityClass(level)}`}>
      <span className="priority-label">{level}</span>
      <span className="priority-score">{score}</span>
    </div>
  );
}
