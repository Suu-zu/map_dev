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

  useEffect(() => {
  fetchRecords();
  }, []);

  return (
    <div className="container">
      <h1>推し活マップ</h1>

      <Map records={records} />

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
      <h2>登録済みライブ</h2>

      {records.length === 0 ? (
        <p>まだ登録されていません。</p>
      ) : (
        <ul>
          {records.map((record) => (
            <li key={record.id} className="record-card">
              <strong>🎤 {record.artist}</strong><br />
              🎫 {record.eventName}<br />
              📍 {record.venue}<br />
              📅 {record.date}<br /><br />

              <button onClick={() => handleEdit(record)}>
              編集
              </button>

              {" "}

              <button onClick={() => handleDelete(record.id)}>
              削除
              </button>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

export default App;