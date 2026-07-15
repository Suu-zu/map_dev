import React, { useState } from "react";

// 日付から「年」「月.日」「曜日」をきれいに抜き出す関数 📅
const parseDateForTicket = (dateStr) => {
  if (!dateStr) return { year: "----", monthDay: "--.--", dayOfWeek: "" };
  
  // "YYYY-MM-DD" を安全に分割
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    // 曜日の計算
    const d = new Date(year, month - 1, day);
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    const dayOfWeek = isNaN(d.getTime()) ? "" : days[d.getDay()];
    
    return {
      year: year,
      monthDay: `${month}.${day}`,
      dayOfWeek: dayOfWeek
    };
  }
  
  return { year: "----", monthDay: dateStr, dayOfWeek: "" };
};

export default function HomeTab({ records, summaryData, nextLive, handleEdit, handleDelete }) {
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [openYear, setOpenYear] = useState(null);

  const recordsByYear = records.reduce((acc, record) => {
    const year = record.date ? record.date.substring(0, 4) : "その他";
    if (!acc[year]) acc[year] = [];
    acc[year].push(record);
    return acc;
  }, {});

  const sortedYears = Object.keys(recordsByYear).sort((a, b) => b - a);

  // 一覧・編集画面（ハートを押したときに表示される画面）
  if (showAllRecords) {
    return (
      <div className="tab-page">
        <div className="all-records-page">
          <div className="page-header">
            <button className="btn-back" onClick={() => setShowAllRecords(false)}>← 戻る</button>
            <h2>ライブ参加記録一覧 </h2>
          </div>

          <div className="accordion-list">
            {sortedYears.length === 0 ? (
              <p className="empty-text">まだ登録されていません。</p>
            ) : (
              sortedYears.map((year) => (
                <div key={year} className="accordion-item">
                  <button 
                    className="accordion-header"
                    onClick={() => setOpenYear(openYear === year ? null : year)}
                  >
                    <span>🗓️ {year}年 （{recordsByYear[year].length}回）</span>
                    <span>{openYear === year || (openYear === null && year === sortedYears[0]) ? "▲" : "▼"}</span>
                  </button>

                  {(openYear === year || (openYear === null && year === sortedYears[0])) && (
                    <ul className="accordion-content">
                      {recordsByYear[year].map((record) => {
                        const ticketDate = parseDateForTicket(record.date);
                        return (
                          <li key={record.id} className="ticket-card-wrapper">
                            
                            {/* チケット風カード本体 🎫 */}
                            <div className="ticket-card">
                              {/* 左端のピンクストライプ */}
                              <div className="ticket-color-bar"></div>

                              {/* チケットのメイン部分（左半分） */}
                              <div className="ticket-main">
                                <div className="ticket-event-name" title={record.eventName}>
                                  {record.eventName || "（イベント名なし）"}
                                </div>
                                <div className="ticket-artist">{record.artist}</div>
                                <div className="ticket-venue">{record.venue}</div>
                                
                              </div>

                              {/* 切り取りミシン線 */}
                              <div className="ticket-tear-line"></div>

                              {/* チケットの半券部分（右半分） */}
                              <div className="ticket-stub">
                                <div className="stub-year">{ticketDate.year}</div>
                                <div className="stub-date">{ticketDate.monthDay}</div>
                                {ticketDate.dayOfWeek && (
                                  <div className="stub-day">{ticketDate.dayOfWeek}</div>
                                )}
                                
                                {/* かわいい飾りバーコード */}
                                <div className="stub-barcode">
                                  <span></span><span></span><span></span><span></span><span></span>
                                  <span></span><span></span><span></span><span></span><span></span>
                                </div>
                              </div>
                            </div>

                            {/* チケットの美しさを邪魔しない、ホバー時にフワッと出る編集・削除ボタン */}
                            <div className="ticket-actions">
                              <button className="btn-edit-sm" onClick={() => handleEdit(record)} title="編集">✏️</button>
                              <button className="btn-delete-sm" onClick={() => handleDelete(record.id)} title="削除">🗑️</button>
                            </div>

                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // 通常のホーム画面
  return (
    <div className="tab-page">
      <div className="top-header">
        <span className="user-badge">{summaryData.userBadge}</span>
        <button 
          className="btn-heart-list" 
          onClick={() => setShowAllRecords(true)} 
          title="記録一覧を見る"
        >
          🩷
        </button>
      
      </div>

      <div className="next-live-card">
        <div className="card-tag">NEXT LIVE 🎤</div>
        {nextLive ? (
          <>
            <div className="countdown-title">あと <span className="highlight-num">{nextLive.daysLeft}</span> 日！</div>
            <div className="next-live-info">{nextLive.date} @ {nextLive.venue}</div>
          </>
        ) : (
          <div className="next-live-info" style={{ marginTop: "8px" }}>予定されている次のライブはありません</div>
        )}
      </div>

      <div className="summary-grid">
        <div className="summary-box">
          <span className="box-label">総参戦回数</span>
          <span className="box-value">{records.length} <small>回</small></span>
        </div>
        <div className="summary-box">
          <span className="box-label">今年の遠征</span>
          <span className="box-value">{summaryData.thisYearCount} <small>回</small></span>
        </div>
        <div className="summary-box full-width">
          <span className="box-label">総移動距離</span>
          <span className="box-value">{summaryData.totalDistance} <small>km</small></span>
          <span className="box-sub">地球 約 {summaryData.earthLaps} 周 🌍</span>
        </div>
      </div>

      <div className="prefecture-card">
        <div className="pref-header">
          <span>🗾 都道府県制覇</span>
          <strong>{summaryData.prefCount} / 47 ({summaryData.prefPercentage}%)</strong>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${summaryData.prefPercentage}%` }}></div>
        </div>
      </div>

      <div className="recent-section">
        <div className="section-header">
          <h3>最近行ったライブ</h3>
        </div>

        {records.length === 0 ? (
          <p className="empty-text">まだ登録されていません。</p>
        ) : (
          <ul className="recent-list">
            {[...records].reverse().slice(0, 3).map((record) => (
              <li key={record.id} className="recent-item">
                <div className="recent-date">{record.date}</div>
                <div className="recent-detail">
                  <strong>{record.artist}</strong>
                  <span>@{record.venue}</span>
                </div>
                <div className="recent-actions">
                  <button className="btn-edit-sm" onClick={() => handleEdit(record)}>✏️</button>
                  <button className="btn-delete-sm" onClick={() => handleDelete(record.id)}>🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}