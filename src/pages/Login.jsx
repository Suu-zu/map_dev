import { useState } from "react";
import { supabase } from "../supabase";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert("確認メールを送信しました！メールをご確認ください 💌");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* アイコンとタイトル */}
        <div className="login-header">
          <p className="login-subtext">
       
          </p>
        </div>

        {/* フォームエリア */}
        <form onSubmit={handleAuth} className="login-form">
          <div className="input-group">
            <label>メールアドレス</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>パスワード</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-login-submit" disabled={loading}>
            {loading ? "送信中... " : isSignUp ? "登録する" : "ログイン"}
          </button>
        </form>

        {/* 切替ボタン */}
        <div className="login-footer">
          <button
            type="button"
            className="btn-toggle"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp
              ? "すでにアカウントをお持ちの方（ログイン）"
              : "はじめての方はこちら（新規登録）"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;