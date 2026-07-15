import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase";
import "./App.css";

// 外部ファイルのインポート
import { getCoordinates } from "./utils/geo";
import { getSummaryData, getNextLive } from "./utils/summary";
import HomeTab from "./components/HomeTab";
import MapTab from "./components/MapTab";
import ProfileTab from "./components/ProfileTab";
import Login from "./pages/Login";
import HomeLocation from "./pages/HomeLocation";
import LoadingAnimation from "./components/LoadingAnimation";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [records, setRecords] = useState([]);
  const [homeLocation, setHomeLocation] = useState(null);
  const [session, setSession] = useState(null);
  const [hasHome, setHasHome] = useState(false);
  const [loadingHome, setLoadingHome] = useState(true);

  // フォーム用ステート
  const [artist, setArtist] = useState("");
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [transportation, setTransportation] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  // サマリーとNEXT LIVEの自動計算
  const summaryData = useMemo(() => getSummaryData(records, homeLocation), [records, homeLocation]);
  const nextLive = useMemo(() => getNextLive(records), [records]);

  // データ保存・編集
  const handleRegister = async () => {
    if (!artist || !eventName || !venue || !date) {
      alert("すべて入力してください");
      return;
    }
    const { lat, lng } = await getCoordinates(venue);

    if (isEditing) {
      const { error } = await supabase.from("live_records").update({
        artist, event_name: eventName, venue, event_date: date, transportation, latitude: lat, longitude: lng,
      }).eq("id", editingId);

      if (error) return alert("更新に失敗しました");
      await fetchRecords();
      setEditingId(null);
      setIsEditing(false);
      setShowFormModal(false);
    } else {
      const { error } = await supabase.from("live_records").insert([{
        artist, event_name: eventName, venue, event_date: date, transportation, latitude: lat, longitude: lng,
      }]);

      if (error) return alert("保存に失敗しました");
      await fetchRecords();
      setShowFormModal(false);
    }
    // フォームをリセット
    setArtist(""); setEventName(""); setVenue(""); setDate(""); setTransportation("");
  };

  const handleEdit = (record) => {
    setArtist(record.artist);
    setEventName(record.eventName);
    setVenue(record.venue);
    setDate(record.date);
    setTransportation(record.transportation || "");
    setEditingId(record.id);
    setIsEditing(true);
    setActiveTab("map"); // ✏️を押した時に自動でマップタブに切り替えてモーダルを開く
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("このライブ記録を削除してもよろしいですか？")) return;
    const { error } = await supabase.from("live_records").delete().eq("id", id);
    if (error) return alert("削除に失敗しました");
    fetchRecords();
  };

  const fetchRecords = async () => {
    const { data, error } = await supabase.from("live_records").select("*").order("event_date", { ascending: true });
    if (error) return console.error(error);
    setRecords(data.map((item) => ({
      id: item.id, artist: item.artist, eventName: item.event_name, venue: item.venue,
      date: item.event_date, transportation: item.transportation, latitude: item.latitude, longitude: item.longitude,
    })));
  };

  const checkHomeLocation = async (userId) => {
    const { data, error } = await supabase.from("home_location").select("*").eq("user_id", userId).limit(1);
    if (error) return console.error(error);
    setHasHome(data.length > 0);
    setLoadingHome(false);
  };

  const fetchHomeLocation = async (userId) => {
    const { data, error } = await supabase.from("home_location").select("*").eq("user_id", userId).single();
    if (error) return console.error(error);
    setHomeLocation(data);
  };

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  if (showSplash) return <LoadingAnimation onFinish={() => setShowSplash(false)} />;
  if (!session) return <Login />;
  if (loadingHome) return <p style={{ textAlign: "center", marginTop: "50px" }}>読み込み中...</p>;
  if (!hasHome) return <HomeLocation session={session} onComplete={() => setHasHome(true)} />;

  return (
    <div className="container">
      <div className="main-content">
        {activeTab === "home" && (
          <HomeTab records={records} summaryData={summaryData} nextLive={nextLive} handleEdit={handleEdit} handleDelete={handleDelete} />
        )}
        {activeTab === "map" && (
          <MapTab
            records={records} homeLocation={homeLocation}
            artist={artist} setArtist={setArtist} eventName={eventName} setEventName={setEventName}
            venue={venue} setVenue={setVenue} date={date} setDate={setDate}
            transportation={transportation} setTransportation={setTransportation}
            isEditing={isEditing} setIsEditing={setIsEditing} showFormModal={showFormModal} setShowFormModal={setShowFormModal}
            handleRegister={handleRegister}
          />
        )}
        {activeTab === "profile" && (
          <ProfileTab session={session} summaryData={summaryData} recordsCount={records.length} setHasHome={setHasHome} />
        )}
      </div>

      <nav className="bottom-nav">
        <button className={activeTab === "home" ? "active" : ""} onClick={() => setActiveTab("home")}>
          <span>🏠</span><span>ホーム</span>
        </button>
        <button className={activeTab === "map" ? "active" : ""} onClick={() => setActiveTab("map")}>
          <span>🗺️</span><span>マップ</span>
        </button>
        <button className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>
          <span>👤</span><span>マイページ</span>
        </button>
      </nav>
    </div>
  );
}

export default App;