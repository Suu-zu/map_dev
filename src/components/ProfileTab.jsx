import React from "react";
import { supabase } from "../supabase";

export default function ProfileTab({ session, summaryData, recordsCount, setHasHome }) {
  return (
    <div className="tab-page profile-page">
      <h2>マイページ 👤</h2>

      <div className="profile-card">
        <div className="user-info">
          <div>
            <h3 className="user-email">{session?.user?.email || "ユーザー"}</h3>
            <span className="user-badge">{summaryData.userBadge}</span>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3>アカウント・データ設定</h3>
        
        <div className="setting-item">
          <div>
            <strong>🏠 自宅の位置情報</strong>
            <p className="setting-desc">遠征距離の基準になる自宅の変更</p>
          </div>
          <button className="btn-secondary" onClick={() => setHasHome(false)}>変更する</button>
        </div>

        <div className="setting-item">
          <div>
            <strong>📊 参戦データの集計</strong>
            <p className="setting-desc">全 {recordsCount} 件の記録を登録中</p>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3>🏆 獲得できる称号一覧</h3>
        <ul className="badge-list">
          <li className={summaryData.prefCount < 3 && recordsCount < 5 ? "active-badge" : ""}>
            🏠 ご近所オタク <small>（初期状態）</small>
          </li>
          <li className={summaryData.prefCount >= 3 || recordsCount >= 5 ? "active-badge" : ""}>
            🚃 フットワーク軽めオタク <small>（3都道府県 or 5回）</small>
          </li>
          <li className={summaryData.prefCount >= 10 || recordsCount >= 15 ? "active-badge" : ""}>
            🚄 遠征中級者オタク <small>（10都道府県 or 15回）</small>
          </li>
          <li className={summaryData.prefCount >= 20 || recordsCount >= 30 ? "active-badge" : ""}>
            ✈️ 旅するオタク <small>（20都道府県 or 30回）</small>
          </li>
          <li className={summaryData.prefCount >= 35 || recordsCount >= 50 ? "active-badge" : ""}>
            🗾 全国行脚オタク <small>（35都道府県 or 50回）</small>
          </li>
          <li className={summaryData.prefCount >= 47 ? "active-badge" : ""}>
            👑 全国制覇神オタク <small>（47都道府県全制覇）</small>
          </li>
        </ul>
      </div>

      <div className="logout-area">
        <button className="btn-logout" onClick={() => supabase.auth.signOut()}>ログアウト 🚪</button>
      </div>
    </div>
  );
}