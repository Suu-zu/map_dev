import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useEffect, useMemo, useRef } from "react";

// 🏠 自宅アイコン
const homeIcon = L.divIcon({
  className: "custom-home-pin",
  html: `<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🏠</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// 📍 通常のピンアイコン（ズームに応じて会場名ラベルを表示）
const createLocationIcon = (venueName, isZoomedIn) => {
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
const getMovingIcon = (transportation) => {
  let emoji = "🏃"; // 未設定（デフォルト）は「走る人」にして勝手に車にしない

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

// 2点間の直線距離
function getDistance(lat1, lon1, lat2, lon2) {
  const dx = lat1 - lat2;
  const dy = lon1 - lon2;
  return Math.sqrt(dx * dx + dy * dy);
}

// ✈️ 飛行機用の曲線（ベジェ曲線）上の座標を計算する関数
function getArcPoint(start, end, progress) {
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
function getArcPath(start, end, steps = 30) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    points.push(getArcPoint(start, end, i / steps));
  }
  return points;
}

// 🔍 ズームレベルを監視するコンポーネント
function ZoomListener({ onZoomChange }) {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    },
  });
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, []);
  return null;
}

function Map({ records = [], homeLocation }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0); // 0: 行き, 1: 帰り
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("year");
  const [currentZoom, setCurrentZoom] = useState(6);

  const sortedRecords = useMemo(() => {
    return [...records]
      .filter((r) => r && r.latitude != null && r.longitude != null)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [records]);

  const groupedByYear = useMemo(() => {
    const map = {};
    sortedRecords.forEach((r) => {
      const year = r.date ? r.date.substring(0, 4) : "不明";
      if (!map[year]) map[year] = [];
      map[year].push(r);
    });
    return map;
  }, [sortedRecords]);

  const groupedByArtist = useMemo(() => {
    const map = {};
    sortedRecords.forEach((r) => {
      const artist = r.artist || "その他";
      if (!map[artist]) map[artist] = [];
      map[artist].push(r);
    });
    return map;
  }, [sortedRecords]);

  const recordsRef = useRef(sortedRecords);
  const stepRef = useRef(step);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => { recordsRef.current = sortedRecords; }, [sortedRecords]);
  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  // ★ 現在再生対象のライブレコード
  const target = sortedRecords[currentIndex];

  // ★ 現在のライブの移動手段が「飛行機」かどうかを判定
  const isPlane = useMemo(() => {
    if (!target) return false;
    const trans = target.transportation;
    return trans === "plane" || trans === "飛行機";
  }, [target]);

  const currentDuration = useMemo(() => {
    if (!homeLocation || !target) return 2000;
    const dist = getDistance(
      homeLocation.latitude, homeLocation.longitude,
      target.latitude, target.longitude
    );
    return Math.max(1200, Math.min(5000, dist * 18000));
  }, [homeLocation, target]);

  // 移動中座標（飛行機ならアーチ移動、それ以外は直線移動）
  const movingPosition = useMemo(() => {
    if (!homeLocation || !target || !isPlaying) return null;
    const home = [homeLocation.latitude, homeLocation.longitude];
    const venue = [target.latitude, target.longitude];
    const start = step === 0 ? home : venue;
    const end = step === 0 ? venue : home;

    if (isPlane) {
      return getArcPoint(start, end, progress);
    } else {
      return [
        start[0] + (end[0] - start[0]) * progress,
        start[1] + (end[1] - start[1]) * progress,
      ];
    }
  }, [progress, step, target, homeLocation, isPlaying, isPlane]);

  // ルート線（飛行機ならアーチ状、それ以外は直線）
  const polylinePositions = useMemo(() => {
    if (!homeLocation || !target) return [];
    const home = [homeLocation.latitude, homeLocation.longitude];
    const venue = [target.latitude, target.longitude];

    if (isPlane) {
      return getArcPath(home, venue);
    }
    return [home, venue];
  }, [homeLocation, target, isPlane]);

  useEffect(() => {
    if (!isPlaying || !homeLocation || recordsRef.current.length === 0) return;

    let animationFrameId;
    let lastTime = performance.now();

    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      setProgress((prev) => {
        const next = prev + deltaTime / currentDuration;

        if (next >= 1) {
          const currentStep = stepRef.current;
          const currentIdx = currentIndexRef.current;
          const total = recordsRef.current.length;

          if (currentStep === 0) {
            setStep(1);
          } else {
            if (currentIdx + 1 >= total) {
              setIsPlaying(false);
              setCurrentIndex(0);
              setStep(0);
              return 0;
            }
            setStep(0);
            setCurrentIndex(currentIdx + 1);
          }
          return 0;
        }
        return next;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animate);
  }, [isPlaying, homeLocation, currentDuration]);

  const handleTogglePlay = () => {
    if (!isPlaying) {
      if (currentIndex >= sortedRecords.length) {
        setCurrentIndex(0);
        setStep(0);
        setProgress(0);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const centerPos = homeLocation
    ? [homeLocation.latitude, homeLocation.longitude]
    : [35.681236, 139.767125];

  const isZoomedIn = currentZoom >= 8;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      
      {/* 🎬 再生ボタン */}
      <button
        onClick={handleTogglePlay}
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          zIndex: 1000,
          background: "#ffffff",
          border: "2px solid #1a1a1a",
          borderRadius: "30px",
          padding: "8px 16px",
          fontWeight: "bold",
          fontSize: "14px",
          cursor: "pointer",
          boxShadow: "2px 2px 0px #1a1a1a",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {isPlaying ? "⏸️ 一時停止" : "▶️ 軌跡を再生"}
      </button>

      {/* 📋 開くボタン */}
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 1000,
            background: "#1a1a1a",
            color: "#ffffff",
            border: "none",
            borderRadius: "30px",
            padding: "8px 16px",
            fontWeight: "bold",
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          }}
        >
          📜 ライブ一覧
        </button>
      )}

      {/* 🌑 オーバーレイ */}
      {isPanelOpen && (
        <div
          onClick={() => setIsPanelOpen(false)}
          style={{
            position: "absolute",
            top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(0, 0, 0, 0.3)", zIndex: 1001, cursor: "pointer",
          }}
        />
      )}

      {/* 📂 パネル */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: isPanelOpen ? 0 : "-320px",
          width: "300px", height: "100%", background: "#ffffff",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.2)", zIndex: 1002,
          transition: "right 0.3s ease-in-out", display: "flex",
          flexDirection: "column", padding: "16px", boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #eee" }}>
          <h3 style={{ margin: 0, fontSize: "16px", color: "#1a1a1a", textAlign: "center" }}>
            📜 参戦ライブ一覧
          </h3>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            onClick={() => setActiveTab("year")}
            style={{
              flex: 1, padding: "6px 0", borderRadius: "8px", border: "none",
              fontWeight: "bold", fontSize: "13px", cursor: "pointer",
              background: activeTab === "year" ? "#1a1a1a" : "#eee",
              color: activeTab === "year" ? "#fff" : "#666",
            }}
          >
            🗓️ 年代別
          </button>
          <button
            onClick={() => setActiveTab("artist")}
            style={{
              flex: 1, padding: "6px 0", borderRadius: "8px", border: "none",
              fontWeight: "bold", fontSize: "13px", cursor: "pointer",
              background: activeTab === "artist" ? "#1a1a1a" : "#eee",
              color: activeTab === "artist" ? "#fff" : "#666",
            }}
          >
            🎤 アーティスト別
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          {activeTab === "year" &&
            Object.keys(groupedByYear).sort((a, b) => b - a).map((year) => (
              <div key={year} style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: "bold", color: "#ff2a75", borderBottom: "2px solid #ff2a75", paddingBottom: "4px", marginBottom: "8px" }}>
                  📅 {year}年 ({groupedByYear[year].length}公演)
                </div>
                {groupedByYear[year].map((r, i) => (
                  <div key={i} style={{ background: "#f9f9f9", padding: "8px 10px", borderRadius: "6px", marginBottom: "6px", fontSize: "12px" }}>
                    <div style={{ fontWeight: "bold", color: "#333" }}>{r.artist}</div>
                    <div style={{ color: "#666" }}>{r.eventName}</div>
                    <div style={{ color: "#888", fontSize: "11px" }}>📍 {r.venue} ({r.date})</div>
                  </div>
                ))}
              </div>
            ))}

          {activeTab === "artist" &&
            Object.keys(groupedByArtist).map((artist) => (
              <div key={artist} style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: "bold", color: "#ff2a75", borderBottom: "2px solid #ff2a75", paddingBottom: "4px", marginBottom: "8px" }}>
                  🎤 {artist} ({groupedByArtist[artist].length}公演)
                </div>
                {groupedByArtist[artist].map((r, i) => (
                  <div key={i} style={{ background: "#f9f9f9", padding: "8px 10px", borderRadius: "6px", marginBottom: "6px", fontSize: "12px" }}>
                    <div style={{ fontWeight: "bold", color: "#333" }}>{r.eventName}</div>
                    <div style={{ color: "#888", fontSize: "11px" }}>📍 {r.venue} ({r.date})</div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>

      {/* 🗺️ 地図エリア */}
      <MapContainer
        center={centerPos}
        zoom={6}
        style={{ height: "100%", width: "100%", borderRadius: "12px" }}
      >
        <ZoomListener onZoomChange={setCurrentZoom} />

        <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

        {/* 🏠 自宅 */}
        {homeLocation && (
          <Marker position={[homeLocation.latitude, homeLocation.longitude]} icon={homeIcon}>
            <Popup>🏠 自宅</Popup>
          </Marker>
        )}

        {/* 📍 会場ピン */}
        {sortedRecords.map((record, idx) => (
          <Marker
            key={record.id || idx}
            position={[record.latitude, record.longitude]}
            icon={createLocationIcon(record.venue, isZoomedIn)}
          >
            <Popup>
              <strong>🎤 {record.artist}</strong><br />
              🎫 {record.eventName}<br />
              📍 {record.venue}<br />
              📅 {record.date}
            </Popup>
          </Marker>
        ))}

        {/* 🛣️ ルート線（現在再生中のライブが飛行機ならアーチ、それ以外は直線） */}
        {isPlaying && homeLocation && target && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: "#ff2a75",
              weight: 4,
              dashArray: "8, 8",
              opacity: 0.8,
            }}
          />
        )}

        {/* 🚗/✈️/🚅/🚃 現在再生中のライブ（target）の移動手段に応じたアイコン */}
        {movingPosition && target && (
          <Marker
            position={movingPosition}
            icon={getMovingIcon(target.transportation)}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default Map;