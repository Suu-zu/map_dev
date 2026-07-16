import { useState } from "react";
import "./LoadingAnimation.css";

export default function LoadingAnimation({ onFinish }) {
  const [isTorn, setIsTorn] = useState(false);

  const handleTouch = () => {
    if (isTorn) return;
    setIsTorn(true);

    // 白いもやで包まれて完全に消えるタイミング（1.2秒後）に画面移動
    setTimeout(() => {
      onFinish();
    }, 1200);
  };

  return (
    <div className={`splash-container ${isTorn ? "active" : ""}`} onClick={handleTouch}>
      {/* 画面全体を包み込む「白いもや」 */}
      <div className="soft-mist-overlay"></div>

      <div className={`ticket-wrapper ${isTorn ? "torn" : ""}`}>
        {/* チケット本体（左側） */}
        <div className="ticket-body">
          <div className="ticket-decor-top">✦ LIVE MEMORIES ✦</div>
          <div className="ticket-title">SPECIAL PASS</div>
          <div className="ticket-sub">思い出をあつめよう</div>
          <div className="tap-text">♡ TOUCH TO ENTER ♡</div>
        </div>

        {/* チケット半券（右側） */}
        <div className="ticket-stub">
          <span className="stub-text">ADMIT ONE</span>
          <span className="stub-icon">🎟️</span>
        </div>
      </div>
    </div>
  );
}