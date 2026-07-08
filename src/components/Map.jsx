import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { useState, useEffect, useMemo, useRef } from "react";

// デフォルトピン
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// 🏃 移動中の絵文字アイコン
const movingIcon = L.divIcon({
  className: "custom-moving-icon",
  html: "<div style='font-size: 28px; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.3));'>🏃</div>",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// 2点間の直線距離（概算）
function getDistance(lat1, lon1, lat2, lon2) {
  const dx = lat1 - lat2;
  const dy = lon1 - lon2;
  return Math.sqrt(dx * dx + dy * dy);
}

function Map({ records = [], homeLocation }) {
  const [isPlaying, setIsPlaying] = useState(false); // ★再生中フラグ
  const [step, setStep] = useState(0); // 0: 行き, 1: 帰り
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 日付順ソート
  const sortedRecords = useMemo(() => {
    return [...records]
      .filter((r) => r && r.latitude != null && r.longitude != null)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [records]);

  // 最新の値を ref に保持
  const recordsRef = useRef(sortedRecords);
  const stepRef = useRef(step);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    recordsRef.current = sortedRecords;
  }, [sortedRecords]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const target = sortedRecords[currentIndex];

  // 距離に応じた「アニメーション時間」
  const currentDuration = useMemo(() => {
    if (!homeLocation || !target) return 2000;
    
    const dist = getDistance(
      homeLocation.latitude,
      homeLocation.longitude,
      target.latitude,
      target.longitude
    );

    const speedFactor = 20000; 
    const calculatedDuration = dist * speedFactor;

    return Math.max(1000, Math.min(6000, calculatedDuration));
  }, [homeLocation, target]);

  // 移動中の座標計算
  const movingPosition = useMemo(() => {
    if (!homeLocation || !target || !isPlaying) return null;

    const home = [homeLocation.latitude, homeLocation.longitude];
    const venue = [target.latitude, target.longitude];

    const start = step === 0 ? home : venue;
    const end = step === 0 ? venue : home;

    return [
      start[0] + (end[0] - start[0]) * progress,
      start[1] + (end[1] - start[1]) * progress,
    ];
  }, [progress, step, target, homeLocation, isPlaying]);

  // ⏱️ アニメーションループ（isPlaying が true の時だけ動く）
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
            setStep(1); // 行き終わったら帰りへ
          } else {
            // ★ 最後のライブからの帰宅が終わったら1ループ完了！
            if (currentIdx + 1 >= total) {
              setIsPlaying(false); // 停止
              setCurrentIndex(0);  // 最初に戻す
              setStep(0);
              return 0;
            }

            setStep(0);
            setCurrentIndex(currentIdx + 1); // 次のライブへ
          }
          return 0;
        }
        return next;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, homeLocation, currentDuration]);

  // 再生ボタンが押された時の処理
  const handleTogglePlay = () => {
    if (!isPlaying) {
      // 停止状態からスタートするときは初期位置をリセット
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

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* 🎬 再生 / 一時停止 ボタン */}
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

      <MapContainer
        center={centerPos}
        zoom={6}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: "12px",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 🏠 自宅 */}
        {homeLocation && (
          <Marker position={[homeLocation.latitude, homeLocation.longitude]}>
            <Popup>🏠 自宅</Popup>
          </Marker>
        )}

        {/* 🎤 各ライブ会場 */}
        {sortedRecords.map((record, idx) => (
          <Marker
            key={record.id || idx}
            position={[record.latitude, record.longitude]}
          >
            <Popup>
              <strong>🎤 {record.artist}</strong><br />
              🎫 {record.eventName}<br />
              📍 {record.venue}<br />
              📅 {record.date}
            </Popup>
          </Marker>
        ))}

        {/* 🛣️ 現在のルート線（再生中のみ表示） */}
        {isPlaying && homeLocation && target && (
          <Polyline
            positions={[
              [homeLocation.latitude, homeLocation.longitude],
              [target.latitude, target.longitude],
            ]}
            pathOptions={{
              color: "#ff2a75",
              weight: 4,
              dashArray: "8, 8",
              opacity: 0.7,
            }}
          />
        )}

        {/* 🏃 移動中アイコン */}
        {movingPosition && (
          <Marker position={movingPosition} icon={movingIcon}>
            <Popup>
              {step === 0
                ? `🎤 ${target?.venue || "会場"} へ移動中！`
                : "🏠 帰宅中…"}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default Map;