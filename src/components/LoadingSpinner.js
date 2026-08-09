'use client';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClass = `spinner-${size}`;
  
  return (
    <div className={`loading-spinner-container ${className}`}>
      <div className={`spinner ${sizeClass}`}></div>
    </div>
  );
}
