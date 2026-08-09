'use client';

export default function Timeline({ currentStatus }) {
  const steps = [
    { id: 'Pending', label: 'Reported' },
    { id: 'Assigned', label: 'Assigned' },
    { id: 'In Progress', label: 'In Progress' },
    { id: 'Resolved', label: 'Resolved' }
  ];

  const currentIndex = steps.findIndex(step => step.id.toLowerCase() === currentStatus?.toLowerCase());
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <div className="timeline-container">
      <div className="timeline">
        {steps.map((step, index) => {
          const isCompleted = index <= activeIndex;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.id} className={`timeline-item ${isCompleted ? 'completed' : ''}`}>
              <div className="timeline-dot-container">
                <div className={`timeline-dot ${isCompleted ? 'active' : ''}`}></div>
                {!isLast && <div className={`timeline-line ${index < activeIndex ? 'active' : ''}`}></div>}
              </div>
              <span className="timeline-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
