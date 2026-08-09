const fs = require('fs');
const path = require('path');

// Create simple SVG placeholder images for demo data
const demoDir = path.join(__dirname, 'public', 'uploads', 'demo');

const images = {
  'bin1.jpg': { bg: '#ef4444', icon: '🗑️', text: 'Overflowing Bin' },
  'bin2.jpg': { bg: '#f97316', icon: '🗑️', text: 'Garbage Bin' },
  'bin3.jpg': { bg: '#dc2626', icon: '🗑️', text: 'Full Bin' },
  'leak1.jpg': { bg: '#3b82f6', icon: '💧', text: 'Water Leak' },
  'leak1_fixed.jpg': { bg: '#16a34a', icon: '✅', text: 'Leak Fixed' },
  'leak2.jpg': { bg: '#2563eb', icon: '💧', text: 'Sewer Overflow' },
  'dump1.jpg': { bg: '#a855f7', icon: '🚛', text: 'Illegal Dump' },
  'dump2.jpg': { bg: '#7c3aed', icon: '🚛', text: 'Abandoned Items' },
  'pothole1.jpg': { bg: '#64748b', icon: '🕳️', text: 'Pothole' },
  'pothole2.jpg': { bg: '#475569', icon: '🕳️', text: 'Deep Pothole' },
  'pothole2_fixed.jpg': { bg: '#16a34a', icon: '✅', text: 'Pothole Fixed' },
  'street1.jpg': { bg: '#f59e0b', icon: '🗃️', text: 'Street Waste' },
  'street1_clean.jpg': { bg: '#16a34a', icon: '✅', text: 'Street Cleaned' },
  'street2.jpg': { bg: '#eab308', icon: '🗃️', text: 'Fallen Branches' },
  'other1.jpg': { bg: '#6b7280', icon: '💡', text: 'Broken Light' },
};

for (const [filename, { bg, icon, text }] of Object.entries(images)) {
  const svg = `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="600" height="400" fill="${bg}" rx="8"/>
    <text x="300" y="170" text-anchor="middle" font-size="80" fill="white">${icon}</text>
    <text x="300" y="250" text-anchor="middle" font-size="28" fill="white" font-family="Arial, sans-serif" font-weight="bold">${text}</text>
    <text x="300" y="290" text-anchor="middle" font-size="16" fill="rgba(255,255,255,0.7)" font-family="Arial, sans-serif">SmartWaste Demo Image</text>
  </svg>`;
  
  // Save as SVG with .jpg extension (browsers will still display it)
  // For a real app we'd use sharp/canvas, but this works for demo
  const svgPath = path.join(demoDir, filename.replace('.jpg', '.svg'));
  fs.writeFileSync(svgPath, svg);
  console.log('Created:', svgPath);
}

console.log('Demo images created!');
