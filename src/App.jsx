import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase";
import "./App.css";
import LiveForm from "./components/LiveForm";
import Map from "./components/Map";
import Login from "./pages/Login";
import HomeLocation from "./pages/HomeLocation";
import LoadingAnimation from "./components/LoadingAnimation"; // 🎟️ スプラッシュコンポーネント

// 2点間の直線距離（km）を計算する関数
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球の半径 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
  // 🎟️ サイトを開いた時の「Touch to Screen」演出を表示するかどうかのフラグ
  const [showSplash, setShowSplash] = useState(true);

  const [artist, setArtist] = useState("");
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [transportation, setTransportation] = useState("");

  const [records, setRecords] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [homeLocation, setHomeLocation] = useState(null);

  const [isEditing, setIsEditing] = useState(false);

  const [activeTab, setActiveTab] = useState("home");

  const [showAllRecords, setShowAllRecords] = useState(false);
  const [openYear, setOpenYear] = useState(null);
  
  const [showFormModal, setShowFormModal] = useState(false);

  const [session, setSession] = useState(null);

  const [hasHome, setHasHome] = useState(false);
  const [loadingHome, setLoadingHome] = useState(true);

  // ★ サマリー用データの自動計算
  const summaryData = useMemo(() => {
    const currentYear = new Date().getFullYear().toString();

    // 今年の遠征回数
    const thisYearCount = records.filter(
      (r) => r.date && r.date.startsWith(currentYear)
    ).length;

    // 総移動距離（往復）
    let totalDistance = 0;
    if (homeLocation && homeLocation.latitude && homeLocation.longitude) {
      records.forEach((r) => {
        if (r.latitude && r.longitude) {
          const oneWay = calculateDistance(
            homeLocation.latitude,
            homeLocation.longitude,
            r.latitude,
            r.longitude
          );
          totalDistance += oneWay * 2;
        }
      });
    }

    const earthLaps = (totalDistance / 40075).toFixed(2);

    // 都道府県の判定マッピング
    const prefKeywords = {
      北海道: ["北海道", "札幌", "函館"],
      青森県: ["青森"], 岩手県: ["岩手", "盛岡"], 宮城県: ["宮城", "仙台"], 秋田県: ["秋田"], 山形県: ["山形"], 福島県: ["福島"],
      茨城県: ["茨城", "水戸"], 栃木県: ["栃木", "宇都宮"], 
      群馬県: ["群馬", "高崎", "前橋"], 
      埼玉県: ["埼玉", "さいたま", "所沢", "越谷", "川口"], 
      千葉県: ["千葉", "幕張", "舞浜", "船橋"], 
      東京都: ["東京", "武道館", "ドーム", "渋谷", "新宿", "池袋", "有明", "お台場", "立川", "町田", "八王子", "味の素", "国立競技場"], 
      神奈川県: ["神奈川", "横浜", "ぴあアリーナ", "Kアリーナ", "パシフィコ", "川崎"],
      新潟県: ["新潟"], 富山県: ["富山"], 石川県: ["石川", "金沢"], 福井県: ["福井"],
      山梨県: ["山梨"], 長野県: ["長野", "松本"], 岐阜県: ["岐阜"], 
      静岡県: ["静岡", "エコパ", "浜松"], 
      愛知県: ["愛知", "名古屋", "ガイシ", "バンテリン"], 三重県: ["三重", "鈴鹿"],
      滋賀県: ["滋賀"], 京都府: ["京都"], 
      大阪府: ["大阪", "城ホール", "京セラ", "長居", "梅田", "難波"], 
      兵庫県: ["兵庫", "神戸"], 奈良県: ["奈良"], 和歌山県: ["和歌山"],
      鳥取県: ["鳥取"], 島根県: ["島根"], 岡山県: ["岡山"], 広島県: ["広島"], 山口県: ["山口"],
      徳島県: ["徳島"], 香川県: ["香川", "高松"], 愛媛県: ["愛媛", "松山"], 高知県: ["高知"],
      福岡県: ["福岡", "博多", "ペイペイ"], 佐賀県: ["佐賀"], 長崎県: ["長崎"], 熊本県: ["熊本"], 大分県: ["大分"], 宮崎県: ["宮崎"], 鹿児島県: ["鹿児島"], 沖縄県: ["沖縄"]
    };

    const visitedPrefectures = new Set();

    records.forEach((r) => {
      if (r.prefecture) {
        visitedPrefectures.add(r.prefecture);
        return;
      }

      if (r.venue) {
        let matched = false;
        for (const [pref, keywords] of Object.entries(prefKeywords)) {
          if (keywords.some((kw) => r.venue.includes(kw))) {
            visitedPrefectures.add(pref);
            matched = true;
            break;
          }
        }
        if (matched) return;
      }
    });

    const prefCount = visitedPrefectures.size;
    const prefPercentage = Math.round((prefCount / 47) * 100);

    // 称号の自動判定
    let userBadge = "🏠 ご近所オタク";
    if (prefCount >= 47) {
      userBadge = "👑 全国制覇神オタク";
    } else if (prefCount >= 35 || records.length >= 50) {
      userBadge = "🗾 全国行脚オタク";
    } else if (prefCount >= 20 || records.length >= 30) {
      userBadge = "✈️ 旅するオタク";
    } else if (prefCount >= 10 || records.length >= 15) {
      userBadge = "🚄 遠征中級者オタク";
    } else if (prefCount >= 3 || records.length >= 5) {
      userBadge = "🚃 フットワーク軽めオタク";
    }

    return {
      thisYearCount,
      totalDistance: Math.round(totalDistance).toLocaleString(),
      earthLaps,
      prefCount,
      prefPercentage,
      userBadge,
    };
  }, [records, homeLocation]);

  // NEXT LIVE（次の現場）の自動取得
  const nextLive = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const upcoming = records
      .filter((r) => r.date && r.date >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcoming.length === 0) return null;

    const next = upcoming[0];
    const diffTime = new Date(next.date) - new Date(today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      daysLeft: diffDays,
      date: next.date,
      venue: next.venue,
    };
  }, [records]);

  const handleRegister = async () => {
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
          transportation: transportation, 
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
      setTransportation(""); 

      setEditingId(null);
      setIsEditing(false);
      setShowFormModal(false);
      return;
    }

    const { error } = await supabase
      .from("live_records")
      .insert([
        {
          artist: artist,
          event_name: eventName,
          venue: venue,
          event_date: date,
          transportation: transportation, 
          latitude: lat,   
          longitude: lng,
        },
      ]);

    if (error) {
      alert("保存に失敗しました");
      console.error(error);
      return;
    }

    await fetchRecords();

    setArtist("");
    setEventName("");
    setVenue("");
    setDate("");
    setTransportation(""); 
    setShowFormModal(false); 
  };

  const handleEdit = (record) => {
    setArtist(record.artist);
    setEventName(record.eventName);
    setVenue(record.venue);
    setDate(record.date);
    setTransportation(record.transportation || "");
    setEditingId(record.id);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("このライブ記録を削除してもよろしいですか？")) {
      return;
    }

    const { error } = await supabase
      .from("live_records")
      .delete()
      .eq("id", id);

    if (error) {
      alert("削除に失敗しました");
      console.error(error);
      return;
    }

    fetchRecords();
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
      transportation: item.transportation,
      latitude: item.latitude,   
      longitude: item.longitude,
    }));

    setRecords(formattedData);
  };

  const checkHomeLocation = async (userId) => {
    const { data, error } = await supabase
      .from("home_location")
      .select("*")
      .eq("user_id", userId)
      .limit(1);

    if (error) {
      console.error(error);
      return;
    }

    setHasHome(data.length > 0);
    setLoadingHome(false);
  };

  const fetchHomeLocation = async (userId) => {
    const { data, error } = await supabase
      .from("home_location")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setHomeLocation(data);
  };

  const recordsByYear = records.reduce((acc, record) => {
    const year = record.date ? record.date.substring(0, 4) : "その他";
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(record);
    return acc;
  }, {});

  const sortedYears = Object.keys(recordsByYear).sort((a, b) => b - a);

  useEffect(() => {
    fetchRecords();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);

      if (data.session) {
        checkHomeLocation(data.session.user.id);
        fetchHomeLocation(data.session.user.id); 
      } else {
        setLoadingHome(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session) {
        checkHomeLocation(session.user.id);
        fetchHomeLocation(session.user.id);
      } else {
        setLoadingHome(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 1️⃣ 一番最初：チケットもぎりスプラッシュ画面を表示
  if (showSplash) {
    return <LoadingAnimation onFinish={() => setShowSplash(false)} />;
  }

  // 2️⃣ ログインしてない場合：ログイン画面を表示
  if (!session) {
    return <Login />;
  }

  // 3️⃣ 自宅登録処理中
  if (loadingHome) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>読み込み中...</p>;
  }

  // 4️⃣ 自宅が未登録の場合：自宅登録画面を表示
  if (!hasHome) {
    return (
      <HomeLocation
        session={session}
        onComplete={() => setHasHome(true)}
      />
    );
  }

  // 5️⃣ メイン画面（ログイン完了後）
  return (
    <div className="container">
      <div className="main-content">
        
        {/* ① ホームタブ */}
        {activeTab === "home" && (
          <div className="tab-page">
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
                        <button 
                          className="accordion-header"
                          onClick={() => setOpenYear(openYear === year ? null : year)}
                        >
                          <span>🗓️ {year}年 （{recordsByYear[year].length}回）</span>
                          <span>{openYear === year || (openYear === null && year === sortedYears[0]) ? "▲" : "▼"}</span>
                        </button>

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
                                  {record.transportation && <p className="transport-info">🚃 {record.transportation}</p>}
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
                    ))
                  )}
                </div>
              </div>
            ) : (
              <> 
                <div className="top-header">
                  <span className="user-badge">{summaryData.userBadge}</span>
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
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${summaryData.prefPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="recent-section">
                  <div className="section-header">
                    <h3>最近行ったライブ</h3>
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
                          <div className="recent-actions">
                            <button className="btn-edit-sm" onClick={() => handleEdit(record)}>✏️</button>
                            <button className="btn-delete-sm" onClick={() => handleDelete(record.id)}>🗑️</button>
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

        {/* ② マップタブ */}
        {activeTab === "map" && (
          <div className="tab-page map-page">
            <div className="map-container-full">
              <Map 
                records={records}
                homeLocation={homeLocation}
              />
            </div>

            <button 
              className="fab-button" 
              onClick={() => {
                setIsEditing(false);
                setArtist("");
                setEventName("");
                setVenue("");
                setDate("");
                setTransportation("");
                setShowFormModal(true);
              }}
            >
              ＋
            </button>

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
                    transportation={transportation}          
                    setTransportation={setTransportation}    
                    handleRegister={handleRegister}
                    isEditing={isEditing}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ③ マイページタブ */}
        {activeTab === "profile" && (
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
                <button 
                  className="btn-secondary" 
                  onClick={() => setHasHome(false)}
                >
                  変更する
                </button>
              </div>

              <div className="setting-item">
                <div>
                  <strong>📊 参戦データの集計</strong>
                  <p className="setting-desc">全 {records.length} 件の記録を登録中</p>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>🏆 獲得できる称号一覧</h3>
              <ul className="badge-list">
                <li className={summaryData.prefCount < 3 && records.length < 5 ? "active-badge" : ""}>
                  🏠 ご近所オタク <small>（初期状態）</small>
                </li>
                <li className={summaryData.prefCount >= 3 || records.length >= 5 ? "active-badge" : ""}>
                  🚃 フットワーク軽めオタク <small>（3都道府県 or 5回）</small>
                </li>
                <li className={summaryData.prefCount >= 10 || records.length >= 15 ? "active-badge" : ""}>
                  🚄 遠征中級者オタク <small>（10都道府県 or 15回）</small>
                </li>
                <li className={summaryData.prefCount >= 20 || records.length >= 30 ? "active-badge" : ""}>
                  ✈️ 旅するオタク <small>（20都道府県 or 30回）</small>
                </li>
                <li className={summaryData.prefCount >= 35 || records.length >= 50 ? "active-badge" : ""}>
                  🗾 全国行脚オタク <small>（35都道府県 or 50回）</small>
                </li>
                <li className={summaryData.prefCount >= 47 ? "active-badge" : ""}>
                  👑 全国制覇神オタク <small>（47都道府県全制覇）</small>
                </li>
              </ul>
            </div>

            <div className="logout-area">
              <button 
                className="btn-logout" 
                onClick={() => supabase.auth.signOut()}
              >
                ログアウト 🚪
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 下部固定ナビ */}
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