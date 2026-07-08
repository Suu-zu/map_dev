import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import "./App.css";
import LiveForm from "./components/LiveForm";
import Map from "./components/Map";


const getCoordinates = async (venueName) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(venueName)}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error("座標の取得に失敗しました:", error);
  }
  return { lat: null, lng: null };
};

function App() {
  const [artist, setArtist] = useState("");
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");

  const [records, setRecords] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [activeTab, setActiveTab] = useState("home");

  // ★年別一覧画面を表示しているかどうかのフラグ
  const [showAllRecords, setShowAllRecords] = useState(false);
  // ★開いている年（初期状態は最新の2026年を開くなど）
  const [openYear, setOpenYear] = useState(null);
  
  const handleRegister = async () => {
    // 入力チェック
    if (!artist || !eventName || !venue || !date) {
      alert("すべて入力してください");
      return;
    }

    const { lat, lng } = await getCoordinates(venue);

    if (isEditing) {
      const { error } = await supabase
        .from("live_records")
        .update({
          artist: artist,
          event_name: eventName,
          venue: venue,
          event_date: date,
          latitude: lat,
          longitude: lng,
        })
        .eq("id", editingId);

      if (error) {
        alert("更新に失敗しました");
        console.error(error);
        return;
      }

      await fetchRecords();

      setArtist("");
      setEventName("");
      setVenue("");
      setDate("");

  setEditingId(null);
  setIsEditing(false);

  return;
}

    // Supabaseへ保存
    const { error } = await supabase
      .from("live_records")
      .insert([
        {
          artist: artist,
          event_name: eventName,
          venue: venue,
          event_date: date,
          latitude: lat,   
          longitude: lng,
        },
      ]);

    if (error) {
      alert("保存に失敗しました");
      console.error(error);
      return;
    }

    // 一覧に追加
    await fetchRecords();

    // 入力欄を空にする
    setArtist("");
    setEventName("");
    setVenue("");
    setDate("");
    setShowFormModal(false); 
  };

  const fetchRecords = async () => {
  const { data, error } = await supabase
    .from("live_records")
    .select("*")
    .order("event_date", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  const formattedData = data.map((item) => ({
    id: item.id,
    artist: item.artist,
    eventName: item.event_name,
    venue: item.venue,
    date: item.event_date,
    latitude: item.latitude,   
    longitude: item.longitude,
  }));

  setRecords(formattedData);
};

  const handleEdit = (record) => {
    setArtist(record.artist);
    setEventName(record.eventName);
    setVenue(record.venue);
    setDate(record.date);

    setEditingId(record.id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from("live_records")
      .delete()
      .eq("id", id);

    if (error) {
      alert("削除に失敗しました");
      console.error(error);
      return;
    }

    await fetchRecords();
  };

  // ★年ごとにデータをグループ化する処理
  const recordsByYear = records.reduce((acc, record) => {
    // 日付（YYYY-MM-DD や YYYY/MM/DD）から「年」を取り出す
    const year = record.date ? record.date.substring(0, 4) : "その他";
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(record);
    return acc;
  }, {});

  // 年を降順（新しい年が上）に並べ替え
  const sortedYears = Object.keys(recordsByYear).sort((a, b) => b - a);

  // モーダル（登録フォーム）の開閉フラグ
  const [showFormModal, setShowFormModal] = useState(false);

  useEffect(() => {
  fetchRecords();
  }, []);


  return (
    <div className="container">
      {/* 画面の上部・コンテンツエリア */}
      <div className="main-content">
        
        {/* ① ホームタブが選ばれているとき */}
        {activeTab === "home" && (
          <div className="tab-page">

            {/* ▼ 「すべて見る」画面が開いている時 */}
                {showAllRecords ? (
                  <div className="all-records-page">
                    <div className="page-header">
                      <button className="btn-back" onClick={() => setShowAllRecords(false)}>
                        ← 戻る
                      </button>
                      <h2>ライブ参加記録一覧 📜</h2>
                    </div>

                    <div className="accordion-list">
                      {sortedYears.length === 0 ? (
                        <p className="empty-text">まだ登録されていません。</p>
                      ) : (
                        sortedYears.map((year) => (
                          <div key={year} className="accordion-item">
                            {/* 年のヘッダー（タップで開閉） */}
                            <button 
                              className="accordion-header"
                              onClick={() => setOpenYear(openYear === year ? null : year)}
                            >
                              <span>🗓️ {year}年 （{recordsByYear[year].length}回）</span>
                              <span>{openYear === year || (openYear === null && year === sortedYears[0]) ? "▲" : "▼"}</span>
                            </button>

                            {/* 年の中身 */}
                            {(openYear === year || (openYear === null && year === sortedYears[0])) && (
                              <ul className="accordion-content">
                                {recordsByYear[year].map((record) => (
                                  <li key={record.id} className="record-card">
                                    <div className="card-header">
                                      <strong className="artist-name">🎤 {record.artist}</strong>
                                      <span className="event-date">📅 {record.date}</span>
                                    </div>
                                    <div className="card-body">
                                      <p className="event-title">🎫 {record.eventName}</p>
                                      <p className="venue-name">📍 {record.venue}</p>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  /* ▼ 通常のホームダッシュボード画面 */
                  <> 
                    {/* ヘッダーエリア */}
                    <div className="top-header">
                      <span className="user-name">👤 推し活太郎</span>
                      <span className="user-badge">🏆 旅するオタク</span>
                    </div>

                    {/* 1. 次の現場 */}
                    <div className="next-live-card">
                      <div className="card-tag">NEXT LIVE 🎤</div>
                      <div className="countdown-title">あと <span className="highlight-num">12</span> 日！</div>
                      <div className="next-live-info">2026/07/21 @ 横浜アリーナ</div>
                    </div>

                    {/* 2. 推し活サマリー */}
                    <div className="summary-grid">
                      <div className="summary-box">
                        <span className="box-label">総参戦回数</span>
                        <span className="box-value">{records.length} <small>回</small></span>
                      </div>
                      <div className="summary-box">
                        <span className="box-label">今年の遠征</span>
                        <span className="box-value">14 <small>回</small></span>
                      </div>
                      <div className="summary-box full-width">
                        <span className="box-label">総移動距離</span>
                        <span className="box-value">12,480 <small>km</small></span>
                        <span className="box-sub">地球 約 0.31 周 🌍</span>
                      </div>
                    </div>

                    {/* 3. 都道府県制覇ミニ進捗 */}
                    <div className="prefecture-card">
                      <div className="pref-header">
                        <span>🗾 都道府県制覇</span>
                        <strong>18 / 47 (38%)</strong>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: "38%" }}></div>
                      </div>
                    </div>

                    {/* 4. 最近行ったライブ（直近3件） */}
                    <div className="recent-section">
                      <div className="section-header">
                        <h3>最近行ったライブ</h3>
                        {/* ★クリックですべて見る（年別一覧）画面を表示 */}
                        <button className="btn-see-all" onClick={() => setShowAllRecords(true)}>
                          すべて見る ＞
                        </button>
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
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

        {/* ② マップタブが選ばれているとき */}
        {activeTab === "map" && (
          <div className="tab-page map-page">
            
            {/* 1. メインの地図表示 */}
            <div className="map-container-full">
              <Map records={records} />
            </div>

            {/* 2. 右下の浮遊アクションボタン（＋） */}
            <button 
              className="fab-button" 
              onClick={() => setShowFormModal(true)}
            >
              ＋
            </button>

            {/* 3. ＋ボタンを押した時に出るモーダル（登録フォーム） */}
            {showFormModal && (
              <div className="modal-overlay" onClick={() => setShowFormModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{isEditing ? "ライブ記録の編集 ✏️" : "新規ライブ登録 🎤"}</h3>
                    <button className="btn-close" onClick={() => setShowFormModal(false)}>✕</button>
                  </div>

                  <LiveForm
                    artist={artist}
                    setArtist={setArtist}
                    eventName={eventName}
                    setEventName={setEventName}
                    venue={venue}
                    setVenue={setVenue}
                    date={date}
                    setDate={setDate}
                    handleRegister={handleRegister}
                    isEditing={isEditing}
                  />
                </div>
              </div>
            )}

          </div>
        )}
        
        

        {/* ③ マイページタブが選ばれているとき */}
        {activeTab === "profile" && (
          <div className="tab-page">
            <h1>マイページ 👤</h1>
            <p>※準備中</p>
          </div>
        )}

      </div>

      {/* 下部固定のボトムナビゲーションバー */}
      <nav className="bottom-nav">
        <button 
          className={activeTab === "home" ? "active" : ""} 
          onClick={() => setActiveTab("home")}
        >
          <span>🏠</span>
          <span>ホーム</span>
        </button>

        <button 
          className={activeTab === "map" ? "active" : ""} 
          onClick={() => setActiveTab("map")}
        >
          <span>🗺️</span>
          <span>マップ</span>
        </button>

        <button 
          className={activeTab === "profile" ? "active" : ""} 
          onClick={() => setActiveTab("profile")}
        >
          <span>👤</span>
          <span>マイページ</span>
        </button>
      </nav>
    </div>
  );
}

export default App;