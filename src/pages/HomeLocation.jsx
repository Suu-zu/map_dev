import React, { useState } from "react";
import { supabase } from "../supabase";
import { getCoordinates } from "../utils/geo";

export default function HomeLocation({ session, onComplete }) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      alert("自宅の場所（都道府県や市区町村）を入力してください");
      return;
    }

    setLoading(true);
    try {
      // 入力された文字から座標を取得
      const { lat, lng } = await getCoordinates(address);
      
      // Supabaseに登録
      const { error } = await supabase.from("home_location").insert([
        {
          user_id: session.user.id,
          home_name: address,
          latitude: lat,
          longitude: lng,
        },
      ]);

      if (error) throw error;
      onComplete(); // 登録完了してメイン画面へ
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-location-container">
      <div className="home-location-card">
        <div className="home-location-icon">🏠</div>
        <h2>自宅を登録</h2>
        <p className="home-location-desc">
          ライブ会場までの正確な距離やルートを計算するために、
          およその自宅位置（例：東京都、神奈川県など）を登録してください。
        </p>
        
        <form onSubmit={handleSave} className="home-location-form">
          <input
            type="text"
            placeholder="例：神奈川県"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="home-location-input"
            disabled={loading}
          />
          <button type="submit" className="home-location-btn" disabled={loading}>
            {loading ? "保存中..." : "保存する"}
          </button>
        </form>
      </div>
    </div>
  );
}