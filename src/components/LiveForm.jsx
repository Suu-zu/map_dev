function LiveForm({
  artist,
  setArtist,
  eventName,
  setEventName,
  venue,
  setVenue,
  date,
  setDate,
  transportation,       // 移動手段の状態
  setTransportation,    // 移動手段を更新する関数
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

      {/* 移動手段の入力エリア */}
      <label>
        移動手段
        
        {/* 🌟【超重要】システムがデータを自動回収できるように隠し入力欄を置きます */}
        <input
          type="hidden"
          name="transportation" 
          value={transportation || ""}
        />

        <div className="transport-selector">
          {[
            { value: '', icon: '🏃', label: '指定しない' },
            { value: 'bullet_train', icon: '🚅', label: '新幹線' },
            { value: 'plane', icon: '✈️', label: '飛行機' },
            { value: 'train', icon: '🚃', label: '電車' },
            { value: 'bus', icon: '🚌', label: 'バス' },
            { value: 'car', icon: '🚗', label: '車' }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`transport-btn ${
                (transportation || "") === item.value ? 'active' : ''
              }`}
              onClick={() => setTransportation(item.value)} 
            >
              <span className="transport-icon">{item.icon}</span>
              <span className="transport-label">{item.label}</span>
            </button>
          ))}
        </div>
      </label>
      
      <button type="button" onClick={handleRegister}>
        {isEditing ? "更新する" : "登録する"}
      </button>
    </form>
  );
}

export default LiveForm;