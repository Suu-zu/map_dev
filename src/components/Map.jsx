import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// 分割したファイルをインポート
import { homeIcon, createLocationIcon, getMovingIcon } from "./icons";
import { getDistance, getArcPoint, getArcPath } from "./arc";
import PlayButton from "./PlayButton";
import LiveListPanel from "./LiveListPanel";

// 🔍 ズームレベルを監視するコンポーネント
function ZoomListener({ onZoomChange }) {
  const map = useMapEvents({ zoomend() { onZoomChange(map.getZoom()); } });
  useEffect(() => { onZoomChange(map.getZoom()); }, []);
  return null;
}

export default function Map({ records = [], homeLocation }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0); // 0: 行き, 1: 帰り
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(6);

  const sortedRecords = useMemo(() => {
    return [...records].filter((r) => r && r.latitude != null && r.longitude != null)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [records]);

  const recordsRef = useRef(sortedRecords);
  const stepRef = useRef(step);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => { recordsRef.current = sortedRecords; }, [sortedRecords]);
  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  const target = sortedRecords[currentIndex];
  const isPlane = useMemo(() => target?.transportation === "plane" || target?.transportation === "飛行機", [target]);

  const currentDuration = useMemo(() => {
    if (!homeLocation || !target) return 2000;
    const dist = getDistance(homeLocation.latitude, homeLocation.longitude, target.latitude, target.longitude);
    return Math.max(600, Math.min(2500, dist * 5000));
  }, [homeLocation, target]);

  const movingPosition = useMemo(() => {
    if (!homeLocation || !target || !isPlaying) return null;
    const start = step === 0 ? [homeLocation.latitude, homeLocation.longitude] : [target.latitude, target.longitude];
    const end = step === 0 ? [target.latitude, target.longitude] : [homeLocation.latitude, homeLocation.longitude];
    return isPlane ? getArcPoint(start, end, progress) : [start[0] + (end[0] - start[0]) * progress, start[1] + (end[1] - start[1]) * progress];
  }, [progress, step, target, homeLocation, isPlaying, isPlane]);

  const polylinePositions = useMemo(() => {
    if (!homeLocation || !target) return [];
    const home = [homeLocation.latitude, homeLocation.longitude];
    const venue = [target.latitude, target.longitude];
    return isPlane ? getArcPath(home, venue) : [home, venue];
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
          if (stepRef.current === 0) setStep(1);
          else {
            if (currentIndexRef.current + 1 >= recordsRef.current.length) {
              setIsPlaying(false); setCurrentIndex(0); setStep(0); return 0;
            }
            setStep(0); setCurrentIndex(currentIndexRef.current + 1);
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

  const handleTogglePlay = () => {
    if (!isPlaying && currentIndex >= sortedRecords.length) { setCurrentIndex(0); setStep(0); setProgress(0); }
    setIsPlaying(!isPlaying);
  };

  const centerPos = homeLocation ? [homeLocation.latitude, homeLocation.longitude] : [35.681236, 139.767125];
  const isZoomedIn = currentZoom >= 8;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <PlayButton isPlaying={isPlaying} onClick={handleTogglePlay} />
      <LiveListPanel isPanelOpen={isPanelOpen} setIsPanelOpen={setIsPanelOpen} sortedRecords={sortedRecords} />

      <MapContainer center={centerPos} zoom={6} style={{ height: "100%", width: "100%", borderRadius: "12px" }}>
        <ZoomListener onZoomChange={setCurrentZoom} />
        <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" /> 
        
        {homeLocation && (
          <Marker position={[homeLocation.latitude, homeLocation.longitude]} icon={homeIcon}><Popup>🏠 自宅</Popup></Marker>
        )}

        {sortedRecords.map((r, i) => (
          <Marker key={r.id || i} position={[r.latitude, r.longitude]} icon={createLocationIcon(r.venue, isZoomedIn)}>
            <Popup><strong>🎤 {r.artist}</strong><br />🎫 {r.eventName}<br />📍 {r.venue}<br />📅 {r.date}</Popup>
          </Marker>
        ))}

        {isPlaying && homeLocation && target && <Polyline positions={polylinePositions} pathOptions={{ color: "#ff2a75", weight: 4, dashArray: "8, 8", opacity: 0.8 }} />}
        {movingPosition && target && <Marker position={movingPosition} icon={getMovingIcon(target.transportation)} />}
      </MapContainer>
    </div>
  );
}