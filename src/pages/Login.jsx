import { useState } from "react";
import { supabase } from "../supabase";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        alert(error.message);
        return;
    }

    alert("ログインしました！");
    };

    const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        alert(error.message);
        return;
    }

    alert("アカウントを作成しました！");
    };

    return (
        <div className="login-container">
            <h1>🎤 推し活マップ</h1>

        <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />

        <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>
            ログイン
        </button>

        <button onClick={handleSignUp}>
            新規登録
        </button>
        </div>
    );
    }

export default Login;