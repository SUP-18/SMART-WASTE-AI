export function findDuplicates(category, latitude, longitude, db) {
  if (!latitude || !longitude) return [];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString();

  // Fetch recent unresolved reports of the same category
  const reports = db.prepare(`
    SELECT id, reportId, category, latitude, longitude, status, createdAt
    FROM reports
    WHERE category = ? 
      AND status != 'Resolved'
      AND createdAt >= ?
  `).all(category, sevenDaysAgoStr);

  const duplicates = [];

  // ~500m radius threshold using simple Pythagorean distance (not accurate for poles/equator but fine for local demo)
  // 1 degree latitude is approx 111km. 
  // 500m is roughly 0.0045 degrees.
  const threshold = 0.0045; 

  for (const report of reports) {
    if (report.latitude && report.longitude) {
      const dLat = report.latitude - latitude;
      const dLon = report.longitude - longitude;
      const distance = Math.sqrt(dLat * dLat + dLon * dLon);
      
      if (distance <= threshold) {
        duplicates.push(report);
      }
    }
  }

  return duplicates;
}
