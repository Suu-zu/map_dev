import React from "react";

export default function PlayButton({ isPlaying, onClick }) {
  return (
    <button
      onClick={onClick}
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
  );
}