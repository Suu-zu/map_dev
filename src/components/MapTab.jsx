import React from "react";
import Map from "./Map";
import LiveForm from "./LiveForm";

export default function MapTab({
  records,
  homeLocation,
  artist, setArtist,
  eventName, setEventName,
  venue, setVenue,
  date, setDate,
  transportation, setTransportation,
  isEditing, setIsEditing,
  showFormModal, setShowFormModal,
  handleRegister
}) {
  return (
    <div className="tab-page map-page">
      <div className="map-container-full">
        <Map records={records} homeLocation={homeLocation} />
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
              artist={artist} setArtist={setArtist}
              eventName={eventName} setEventName={setEventName}
              venue={venue} setVenue={setVenue}
              date={date} setDate={setDate}
              transportation={transportation} setTransportation={setTransportation}
              handleRegister={handleRegister}
              isEditing={isEditing}
            />
          </div>
        </div>
      )}
    </div>
  );
}