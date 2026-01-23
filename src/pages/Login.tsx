import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login(email, password);
    navigate("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0f172a",
        padding: 20,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: 24,
          width: 360,
          maxWidth: "100%",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h2 style={{ textAlign: "center", margin: 0 }}>Login ERP</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #cbd5e1",
          }}
        />

        <input
          placeholder="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #cbd5e1",
          }}
        />

        <button
          type="submit"
          style={{
            border: "none",
            background: "#2563eb",
            color: "#fff",
            padding: 10,
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Entrar
        </button>

        <small style={{ textAlign: "center", color: "#64748b" }}>
          (Login: kelvin, Senha: 123)
        </small>
      </form>
    </div>
  );
}
