function LiveForm({
  artist,
  setArtist,
  eventName,
  setEventName,
  venue,
  setVenue,
  date,
  setDate,
  transportation,       // ★ 追加：移動手段の状態
  setTransportation,    // ★ 追加：移動手段を更新する関数
  handleRegister,
  isEditing,
}) {
  return (
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

      {/* ★ 移動手段の選択エリアを追加 */}
      <label>
        移動手段
        <select
          value={transportation || ""}
          onChange={(e) => setTransportation(e.target.value)}
        >
          <option value="">🏃 指定しない</option>
          <option value="bullet_train">🚅 新幹線</option>
          <option value="plane">✈️ 飛行機</option>
          <option value="train">🚃 電車</option>
          <option value="bus">🚌 バス</option>
          <option value="car">🚗 車</option>
        </select>
      </label>

      <button type="button" onClick={handleRegister}>
        {isEditing ? "更新する" : "登録する"}
      </button>
    </form>
  );
}

export default LiveForm;