import L from "leaflet";

// 🏠 自宅アイコン
export const homeIcon = L.divIcon({
  className: "custom-home-pin",
  html: `<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🏠</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// 📍 通常のピンアイコン（ズームに応じて会場名ラベルを表示）
export const createLocationIcon = (venueName, isZoomedIn) => {
  return L.divIcon({
    className: "custom-venue-pin",
    html: `
      <div style="display: flex; align-items: center; white-space: nowrap;">
        <span style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">📍</span>
        ${
          isZoomedIn && venueName
            ? `<span style="
                background: rgba(255, 255, 255, 0.95);
                color: #1a1a1a;
                font-weight: bold;
                font-size: 11px;
                padding: 3px 8px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                border: 1px solid #ff2a75;
                margin-left: -4px;
              ">${venueName}</span>`
            : ""
        }
      </div>
    `,
    iconSize: [120, 30],
    iconAnchor: [10, 25],
  });
};

// 🚗/✈️ 各ライブの移動手段に応じた絵文字アイコンを返す関数
export const getMovingIcon = (transportation) => {
  let emoji = "🏃"; // 未設定（デフォルト）

  if (transportation === "plane" || transportation === "飛行機") emoji = "✈️";
  if (transportation === "bullet_train" || transportation === "新幹線") emoji = "🚅";
  if (transportation === "train" || transportation === "電車") emoji = "🚃";
  if (transportation === "bus" || transportation === "バス") emoji = "🚌";
  if (transportation === "car" || transportation === "車") emoji = "🚗";

  return L.divIcon({
    className: "custom-moving-icon",
    html: `<div style="font-size: 30px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};