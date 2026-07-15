// 2点間の直線距離
export function getDistance(lat1, lon1, lat2, lon2) {
  const dx = lat1 - lat2;
  const dy = lon1 - lon2;
  return Math.sqrt(dx * dx + dy * dy);
}

// ✈️ 飛行機用の曲線（ベジェ曲線）上の座標を計算する関数
export function getArcPoint(start, end, progress) {
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;

  const dist = getDistance(start[0], start[1], end[0], end[1]);
  const offset = dist * 0.25;

  const controlLat = midLat + offset;
  const controlLng = midLng;

  const t = progress;
  const lat = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * controlLat + t * t * end[0];
  const lng = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * controlLng + t * t * end[1];

  return [lat, lng];
}

// 曲線全体のPoints配列（Polyline描画用）
export function getArcPath(start, end, steps = 30) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    points.push(getArcPoint(start, end, i / steps));
  }
  return points;
}