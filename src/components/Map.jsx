import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

function Map() {
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
        <Marker position={[35.7056, 139.7519]}>
            <Popup>
            東京ドーム 🎤
            </Popup>
        </Marker>
        </MapContainer>
    );
}

export default Map;