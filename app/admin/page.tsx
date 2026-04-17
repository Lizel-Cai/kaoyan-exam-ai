"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [keys, setKeys] = useState({});
  const [newKey, setNewKey] = useState("");
  const [batchKeys, setBatchKeys] = useState("");
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState(false);

  // 🔥 前端没有任何密码！F12 看不到！

  // 登录：密码发送到后端验证
  const login = async () => {
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "login",
        password: password.trim()
      }),
    });
    const data = await res.json();
    if (data.valid) {
      setAuth(true);
      localStorage.setItem("adminToken", password.trim());
    } else {
      alert("Wrong password");
    }
  };

  const logout = () => {
    setAuth(false);
    localStorage.removeItem("adminToken");
    setPassword("");
  };

  const fetchKeys = async () => {
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "list",
        password: localStorage.getItem("adminToken")
      }),
    });
    const data = await res.json();
    setKeys(data);
  };

  const addKey = async () => {
    if (!newKey.trim()) return;
    await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add",
        key: newKey.trim(),
        password: localStorage.getItem("adminToken")
      }),
    });
    setNewKey("");
    fetchKeys();
  };

  const batchAddKeys = async () => {
    const lines = batchKeys.split("\n").map(l => l.trim()).filter(Boolean);
    const pwd = localStorage.getItem("adminToken");
    for (const key of lines) {
      await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", key, password: pwd }),
      });
    }
    setBatchKeys("");
    fetchKeys();
  };

  const deleteKey = async (k) => {
    await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        key: k,
        password: localStorage.getItem("adminToken")
      }),
    });
    fetchKeys();
  };

  const resetKey = async (k) => {
    await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reset",
        key: k,
        password: localStorage.getItem("adminToken")
      }),
    });
    fetchKeys();
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      setAuth(true);
      setPassword(token);
      fetchKeys();
    }
  }, []);

  if (!auth) {
    return (
      <div style={{ padding: 40, maxWidth: 400, margin: "0 auto" }}>
        <h2>Admin Login</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 12, margin: "10px 0" }}
        />
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>🔐 License Manager</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <div style={{ margin: "20px 0", display: "flex", gap: 10 }}>
        <input
          style={{ flex: 1, padding: 10 }}
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Single key"
        />
        <button onClick={addKey}>Add</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <textarea
          rows={6}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
          value={batchKeys}
          onChange={(e) => setBatchKeys(e.target.value)}
          placeholder="Batch add keys (one per line)"
        />
        <button onClick={batchAddKeys} style={{ padding: "10px 20px" }}>
          Batch Add Keys
        </button>
      </div>

      {Object.entries(keys).map(([k, v]) => (
        <div
          key={k}
          style={{
            padding: 12,
            border: "1px solid #eee",
            borderRadius: 8,
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <strong>{k}</strong><br />
            <small style={{ color: v.usedBy ? "red" : "green" }}>
              {v.usedBy ? "Used" : "Unused"}
            </small>
          </div>
          <div>
            <button onClick={() => resetKey(k)} style={{ marginRight: 6 }}>Reset</button>
            <button onClick={() => deleteKey(k)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}