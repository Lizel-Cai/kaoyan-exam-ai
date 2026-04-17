import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'key_db.json');

// 🔥 后端管理员密码（F12看不见）
const ADMIN_PASSWORD = "2wsxZSE$";

// 🔥 生成 安全随机激活码（无法猜测）
function generateRandomKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let key = "KAO_";
  for (let i = 0; i < 16; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// 🔥 自动生成 20个 高强度随机码
function generateDefaultKeys() {
  const keys = {};
  for (let i = 1; i <= 20; i++) {
    const key = generateRandomKey();
    keys[key] = { usedBy: null };
  }
  return keys;
}

// 初始化数据库
function initDB() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({
      keys: generateDefaultKeys()
    }, null, 2));
  }
}

function loadDB() {
  initDB();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export async function POST(req) {
  try {
    const { action, key, password } = await req.json();
    const db = loadDB();

    // 登录验证
    if (action === "login") {
      const isValid = password === ADMIN_PASSWORD;
      return NextResponse.json({ valid: isValid });
    }

    // 权限验证
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    if (action === 'list') return NextResponse.json(db.keys);
    if (action === 'add') {
      db.keys[key] = { usedBy: null };
      saveDB(db);
      return NextResponse.json({ ok: true });
    }
    if (action === 'delete') {
      delete db.keys[key];
      saveDB(db);
      return NextResponse.json({ ok: true });
    }
    if (action === 'reset') {
      if (db.keys[key]) db.keys[key].usedBy = null;
      saveDB(db);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false });
  } catch (err) {
    return NextResponse.json({ ok: false });
  }
}