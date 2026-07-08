
function LiveForm({
  artist,
  setArtist,
  eventName,
  setEventName,
  venue,
  setVenue,
  date,
  setDate,
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

      <button type="button" onClick={handleRegister}>
        {isEditing ? "更新する" : "登録する"}
      </button>
    </form>
  );
}

export default LiveForm;