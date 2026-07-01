import { useState } from "react";
import "./App.css";

function App() {
  const [artist, setArtist] = useState("");
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");

  const [records, setRecords] = useState([]);

  const handleRegister = () => {
  // 入力チェック
  if (!artist || !eventName || !venue || !date) {
    alert("すべて入力してください");
    return;
  }

  // 新しいライブ記録
  const newRecord = {
    artist,
    eventName,
    venue,
    date,
  };

  // 一覧に追加
  setRecords([...records, newRecord]);

  // 入力欄を空にする
  setArtist("");
  setEventName("");
  setVenue("");
  setDate("");
};

  return (
    <div className="container">
      <h1>推し活マップ</h1>

      <form className="form">
        <label>
          推し名
          <input
            type="text"
            placeholder="例：〇〇"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
/>
        </label>

        <label>
          イベント名
          <input
            type="text"
            placeholder="例：全国ツアー2026"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
  />
        </label>

        <label>
          会場名
          <input
            type="text"
            placeholder="例：東京ドーム"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
        </label>

        <label>
          開催日
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <button type="button" onClick={handleRegister}>
          登録する
        </button>

      </form>
      <h2>登録済みライブ</h2>

      {records.length === 0 ? (
        <p>まだ登録されていません。</p>
      ) : (
        <ul>
          {records.map((record, index) => (
            <li key={index}>
              <strong>{record.artist}</strong><br />
              {record.eventName}<br />
              {record.venue}<br />
              {record.date}
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

export default App;