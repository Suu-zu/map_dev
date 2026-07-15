import React, { useState, useMemo } from "react";

export default function LiveListPanel({ isPanelOpen, setIsPanelOpen, sortedRecords }) {
  const [activeTab, setActiveTab] = useState("year");

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

  return (
    <>
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          style={{
            position: "absolute", top: "16px", right: "16px", zIndex: 1000,
            background: "#1a1a1a", color: "#ffffff", border: "none",
            borderRadius: "30px", padding: "8px 16px", fontWeight: "bold",
            fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          }}
        >
          📜 ライブ一覧
        </button>
      )}

      {isPanelOpen && (
        <div
          onClick={() => setIsPanelOpen(false)}
          style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(0, 0, 0, 0.3)", zIndex: 1001, cursor: "pointer",
          }}
        />
      )}

      <div
        style={{
          position: "absolute", top: 0, right: isPanelOpen ? 0 : "-320px",
          width: "300px", height: "100%", background: "#ffffff",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.2)", zIndex: 1002,
          transition: "right 0.3s ease-in-out", display: "flex",
          flexDirection: "column", padding: "16px", boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #eee" }}>
          <h3 style={{ margin: 0, fontSize: "16px", color: "#1a1a1a", textAlign: "center" }}>参戦ライブ一覧</h3>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            onClick={() => setActiveTab("year")}
            style={{
              flex: 1, padding: "6px 0", borderRadius: "8px", border: "none", fontWeight: "bold",
              fontSize: "13px", cursor: "pointer", background: activeTab === "year" ? "#1a1a1a" : "#eee",
              color: activeTab === "year" ? "#fff" : "#666",
            }}
          >
            🗓️ 年代別
          </button>
          <button
            onClick={() => setActiveTab("artist")}
            style={{
              flex: 1, padding: "6px 0", borderRadius: "8px", border: "none", fontWeight: "bold",
              fontSize: "13px", cursor: "pointer", background: activeTab === "artist" ? "#1a1a1a" : "#eee",
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
    </>
  );
}