export function calculatePriority({ category, peopleAffected, locationType, upvoteCount, createdAt }) {
  let score = 0;
  const factors = [];

  // Category Risk
  const categoryScores = {
    'Overflowing Bin': 15,
    'Illegal Dumping': 20,
    'Street Waste': 10,
    'Water Leakage': 25,
    'Pothole': 20,
    'Other': 10
  };
  const catScore = categoryScores[category] || 10;
  score += catScore;
  factors.push(`\${category} risk (+\${catScore})`);

  // People Affected
  const peopleScores = {
    '1-5': 10,
    '6-20': 20,
    '21-50': 30,
    '50+': 40
  };
  const pplScore = peopleScores[peopleAffected] || 10;
  score += pplScore;
  factors.push(`Impacts \${peopleAffected} people (+\${pplScore})`);

  // Location Type
  const locationScores = {
    'Residential': 10,
    'School/College': 20,
    'Hospital': 25,
    'Market': 15,
    'Public Road': 15,
    'Park': 10,
    'Other': 5
  };
  const locScore = locationScores[locationType] || 5;
  score += locScore;
  factors.push(`Location type: \${locationType} (+\${locScore})`);

  // Upvotes
  const upvoteBonus = Math.min((upvoteCount || 0) * 2, 20);
  score += upvoteBonus;
  if (upvoteBonus > 0) {
    factors.push(`Community upvotes (+\${upvoteBonus})`);
  }

  // Age Bonus
  let ageBonus = 0;
  if (createdAt) {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    ageBonus = Math.min(diffDays, 5);
    score += ageBonus;
    if (ageBonus > 0) {
      factors.push(`Age bonus: \${ageBonus} days (+\${ageBonus})`);
    }
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Determine Level
  let level = 'Low';
  if (score >= 70) {
    level = 'High';
  } else if (score >= 40) {
    level = 'Medium';
  }

  return {
    score,
    level,
    explanation: factors.join(', ')
  };
}
