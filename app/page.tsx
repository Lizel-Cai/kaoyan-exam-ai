"use client";
import { useState, useEffect, useRef } from "react";

export default function KaoyanExamPH() {
  const [notes, setNotes] = useState("");
  const [subject, setSubject] = useState("politics");
  const [questions, setQuestions] = useState("");
  const [answer, setAnswer] = useState("");
  const [correction, setCorrection] = useState("");
  const [loading, setLoading] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [todayCount, setTodayCount] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [code, setCode] = useState("");
  const MAX_FREE = 3;

  // 用户唯一标识，一码一户
  const getUserId = () => {
    let id = localStorage.getItem("userId");
    if (!id) {
      id = "user_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("userId", id);
    }
    return id;
  };

  // OpenAI 客户端
  const OpenAI = require("openai");
  const client = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    baseURL: process.env.NEXT_PUBLIC_OPENAI_BASE_URL,
    dangerouslyAllowBrowser: true,
  });

  // 初始化免费次数
  useEffect(() => {
    const member = localStorage.getItem("isMember") === "true";
    setIsMember(member);

    const now = new Date().toDateString();
    const last = localStorage.getItem("lastDate");
    const cnt = Number(localStorage.getItem("todayCount")) || 0;

    if (last !== now) {
      localStorage.setItem("lastDate", now);
      localStorage.setItem("todayCount", "0");
      setTodayCount(0);
    } else {
      setTodayCount(cnt);
    }
  }, []);

  const addCount = () => {
    if (isMember) return;
    const next = todayCount + 1;
    localStorage.setItem("todayCount", String(next));
    setTodayCount(next);
  };

  // 激活码兑换
  const redeem = async () => {
    if (!code.trim()) {
      alert("Please enter your license key");
      return;
    }

    try {
      const res = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: code.trim(),
          userId: getUserId(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("isMember", "true");
        setIsMember(true);
        alert("✅ Success! Pro unlocked.");
      } else {
        alert("❌ " + (data.msg || "Invalid code"));
      }
    } catch (err) {
      alert("❌ Activation service error");
    }
  };

  // 文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      if (
        file.type === "text/plain" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md")
      ) {
        const text = await file.text();
        setNotes(text);
        alert("✅ File uploaded successfully!");
      } else {
        alert("❌ Only .txt / .md files are supported");
      }
    } catch (err) {
      alert("❌ File read failed");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 生成题目
  const generate = async () => {
    if (!notes.trim()) return alert("Please paste or upload your notes first");
    if (!isMember && todayCount >= MAX_FREE) {
      alert("Daily free limit reached. Upgrade to Pro.");
      return;
    }

    setLoading(true);
    setQuestions("");
    setCorrection("");

    try {
      let prompt = "";
      if (subject === "politics") {
        prompt = "你是考研政治老师，根据内容生成3道考题+答案，简洁清晰，格式规范";
      } else if (subject === "english") {
        prompt = "你是考研英语老师，生成2道阅读题+翻译+答案，专业简洁";
      } else {
        prompt = "你是考研专业课老师，生成简答+名词解释+标准答案，简洁明了";
      }

      const res = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: notes },
        ],
        max_tokens: 800,
      });

      setQuestions(res.choices[0].message.content || "生成失败");
      addCount();
    } catch (err) {
      alert("API Error");
    }

    setLoading(false);
  };

  // 批改答案
  const correct = async () => {
    if (!answer.trim()) return;
    setCorrecting(true);

    try {
      const res = await client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "你是考研阅卷老师，批改答案、给分、给改进建议，简洁专业",
          },
          { role: "user", content: `题目：${questions}\n学生答案：${answer}` },
        ],
        max_tokens: 600,
      });

      setCorrection(res.choices[0].message.content || "批改失败");
    } catch (err) {
      alert("Grading Error");
    }

    setCorrecting(false);
  };

  // 样式
  const wrap = { maxWidth: "860px", margin: "0 auto", padding: "40px 20px", fontFamily: "Inter, sans-serif" };
  const card = { background: "#fff", borderRadius: "14px", padding: "28px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" };
  const textarea = { width: "100%", padding: "16px", borderRadius: "10px", border: "1px solid #e5e7eb", minHeight: "160px" };
  const button = { width: "100%", padding: "16px", borderRadius: "10px", border: "none", fontWeight: 600, cursor: "pointer" };

  return (
    <div style={wrap}>
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700 }}>Kaoyan Exam AI</h1>
        <p style={{ color: "#666" }}>Generate practice questions & grade answers instantly</p>
        <p style={{ fontSize: 14, color: "#999", marginTop: 8 }}>
          {isMember ? "✅ Pro Unlocked" : `Free today: ${todayCount}/${MAX_FREE}`}
        </p>
      </div>

      <div style={card}>
        <div style={{ marginBottom: 12 }}>
          <input type="file" ref={fileInputRef} accept=".txt,.md" onChange={handleFileUpload} style={{ display: "none" }} />
          <button
            onClick={triggerFileInput}
            disabled={uploadLoading}
            style={{ padding: "10px 16px", borderRadius: 8, backgroundColor: "#64748b", color: "#fff", border: 0 }}
          >
            {uploadLoading ? "Uploading..." : "📎 Upload .txt / .md"}
          </button>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste your notes or upload a file..."
          style={textarea}
        />

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{ width: "100%", padding: 14, borderRadius: 10, border: "1px solid #e5e7eb", margin: "16px 0" }}
        >
          <option value="politics">Politics</option>
          <option value="english">English</option>
          <option value="major">Major Courses</option>
        </select>

        <button onClick={generate} disabled={loading} style={{ ...button, backgroundColor: "#2563eb", color: "#fff" }}>
          {loading ? "Generating..." : "Generate Practice Questions"}
        </button>
      </div>

      {questions && (
        <div style={card}>
          <div style={{ padding: 20, backgroundColor: "#f9fafb", borderRadius: 10, whiteSpace: "pre-wrap" }}>
            {questions}
          </div>
        </div>
      )}

      {questions && (
        <div style={card}>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your answer here..."
            style={textarea}
          />
          <button onClick={correct} disabled={correcting} style={{ ...button, backgroundColor: "#16a34a", color: "#fff", marginTop: 16 }}>
            {correcting ? "Grading..." : "Grade My Answer"}
          </button>
        </div>
      )}

      {correction && (
        <div style={card}>
          <div style={{ padding: 20, backgroundColor: "#f0fdf4", borderRadius: 10 }}>
            <strong>AI Feedback:</strong>
            <div style={{ marginTop: 10 }}>{correction}</div>
          </div>
        </div>
      )}

      {!isMember && (
        <div style={{ ...card, border: "1px solid #fcd34d" }}>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>✨ Pro Unlimited</h3>
          <div style={{ lineHeight: 1.8, fontSize: 14 }}>
            • Unlimited generation • Unlimited AI grading • File upload • No daily limits
          </div>
          <div style={{ margin: "16px 0" }}>
            Contact: <strong>Wiki_Symphony</strong> (WeChat)
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter license key"
              style={{ flex: 1, padding: 14, borderRadius: 10, border: "1px solid #e5e7eb" }}
            />
            <button onClick={redeem} style={{ padding: "0 20px", backgroundColor: "#ea580c", color: "#fff", borderRadius: 10, border: 0 }}>
              Redeem
            </button>
          </div>
        </div>
      )}
    </div>
  );
}