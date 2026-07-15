import { calculateDistance } from "./geo";

export const prefKeywords = {
  北海道: ["北海道", "札幌", "函館"],
  青森県: ["青森"], 岩手県: ["岩手", "盛岡"], 宮城県: ["宮城", "仙台"], 秋田県: ["秋田"], 山形県: ["山形"], 福島県: ["福島"],
  茨城県: ["茨城", "水戸"], 栃木県: ["栃木", "宇都宮"], 
  群馬県: ["群馬", "高崎", "前橋"], 
  埼玉県: ["埼玉", "さいたま", "所沢", "越谷", "川口"], 
  千葉県: ["千葉", "幕張", "舞浜", "船橋"], 
  東京都: ["東京", "武道館", "ドーム", "渋谷", "新宿", "池袋", "有明", "お台場", "立川", "町田", "八王子", "味の素", "国立競技場"], 
  神奈川県: ["神奈川", "横浜", "ぴあアリーナ", "Kアリーナ", "パシフィコ", "川崎"],
  新潟県: ["新潟"], 富山県: ["富山"], 石川県: ["石川", "金沢"], 福井県: ["福井"],
  山梨県: ["山梨"], 長野県: ["長野", "松本"], 岐阜県: ["岐阜"], 
  静岡県: ["静岡", "エコパ", "浜松"], 
  愛知県: ["愛知", "名古屋", "ガイシ", "バンテリン"], 三重県: ["三重", "鈴鹿"],
  滋賀県: ["滋賀"], 京都府: ["京都"], 
  大阪府: ["大阪", "城ホール", "京セラ", "長居", "梅田", "難波"], 
  兵庫県: ["兵庫", "神戸"], 奈良県: ["奈良"], 和歌山県: ["和歌山"],
  鳥取県: ["鳥取"], 島根県: ["島根"], 岡山県: ["岡山"], 広島県: ["広島"], 山口県: ["山口"],
  徳島県: ["徳島"], 香川県: ["香川", "高松"], 愛媛県: ["愛媛", "松山"], 高知県: ["高知"],
  福岡県: ["福岡", "博多", "ペイペイ"], 佐賀県: ["佐賀"], 長崎県: ["長崎"], 熊本県: ["熊本"], 大分県: ["大分"], 宮崎県: ["宮崎"], 鹿児島県: ["鹿児島"], 沖縄県: ["沖縄"]
};

// サマリーデータの算出
export function getSummaryData(records, homeLocation) {
  const currentYear = new Date().getFullYear().toString();

  const thisYearCount = records.filter(
    (r) => r.date && r.date.startsWith(currentYear)
  ).length;

  let totalDistance = 0;
  if (homeLocation && homeLocation.latitude && homeLocation.longitude) {
    records.forEach((r) => {
      if (r.latitude && r.longitude) {
        const oneWay = calculateDistance(
          homeLocation.latitude,
          homeLocation.longitude,
          r.latitude,
          r.longitude
        );
        totalDistance += oneWay * 2;
      }
    });
  }

  const earthLaps = (totalDistance / 40075).toFixed(2);
  const visitedPrefectures = new Set();

  records.forEach((r) => {
    if (r.prefecture) {
      visitedPrefectures.add(r.prefecture);
      return;
    }
    if (r.venue) {
      let matched = false;
      for (const [pref, keywords] of Object.entries(prefKeywords)) {
        if (keywords.some((kw) => r.venue.includes(kw))) {
          visitedPrefectures.add(pref);
          matched = true;
          break;
        }
      }
      if (matched) return;
    }
  });

  const prefCount = visitedPrefectures.size;
  const prefPercentage = Math.round((prefCount / 47) * 100);

  let userBadge = "🏠 ご近所オタク";
  if (prefCount >= 47) {
    userBadge = "👑 全国制覇神オタク";
  } else if (prefCount >= 35 || records.length >= 50) {
    userBadge = "🗾 全国行脚オタク";
  } else if (prefCount >= 20 || records.length >= 30) {
    userBadge = "✈️ 旅するオタク";
  } else if (prefCount >= 10 || records.length >= 15) {
    userBadge = "🚄 遠征中級者オタク";
  } else if (prefCount >= 3 || records.length >= 5) {
    userBadge = "🚃 フットワーク軽めオタク";
  }

  return {
    thisYearCount,
    totalDistance: Math.round(totalDistance).toLocaleString(),
    earthLaps,
    prefCount,
    prefPercentage,
    userBadge,
  };
}

// 次のライブ情報の算出
export function getNextLive(records) {
  const today = new Date().toISOString().split("T")[0];
  const upcoming = records
    .filter((r) => r.date && r.date >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const diffTime = new Date(next.date) - new Date(today);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    daysLeft: diffDays,
    date: next.date,
    venue: next.venue,
  };
}