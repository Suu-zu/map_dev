import { useState } from "react";
import { supabase } from "../supabase";

function HomeLocation({ session, onComplete }) {
  const [homeName, setHomeName] = useState("");

  const getCoordinates = async (place) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`
    );

    const data = await response.json();

    if (data.length === 0) {
      return null;
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  };

  const handleSave = async () => {
    if (!homeName) {
      alert("住所を入力してください");
      return;
    }

    const location = await getCoordinates(homeName);

    if (!location) {
      alert("住所が見つかりませんでした");
      return;
    }

    const { error } = await supabase
      .from("home_location")
      .insert([
        {
          user_id: session.user.id,
          home_name: homeName,
          latitude: location.latitude,
          longitude: location.longitude,
        },
      ]);

    if (error) {
      console.error(error);
      alert("保存に失敗しました");
      return;
    }

    onComplete();
  };

  return (
    <div className="login-container">
      <h1>🏠 自宅を登録</h1>

      <input
        type="text"
        placeholder="例：東京都〇〇市"
        value={homeName}
        onChange={(e) => setHomeName(e.target.value)}
      />

      <button onClick={handleSave}>
        保存
      </button>
    </div>
  );
}

export default HomeLocation;