import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function Map({ records = [] }) {
    return (
        <MapContainer
            center={[35.681236, 139.767125]}
            zoom={6}
            style={{
                height: "400px",
                width: "100%",
                borderRadius: "12px",
            }}
        >
        <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* 登録されたライブデータから動的にピンを表示 */}
        {records.map((record) => {
            if (!record.latitude || !record.longitude) return null;

            return (
                <Marker
                    key={record.id}
                    position={[record.latitude, record.longitude]}
                >
                    <Popup>
                        <strong>🎤 {record.artist}</strong><br />
                        🎫 {record.eventName}<br />
                        📍 {record.venue}<br />
                        📅 {record.date}
                    </Popup>
                </Marker>
            );
        })}
        </MapContainer>
    );
}

export default Map;