import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'key_db.json');

function loadDB() {
  if (!fs.existsSync(dbPath)) {
    return { keys: {} };
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

export async function POST(req) {
  try {
    const { key, userId } = await req.json();
    const db = loadDB();

    if (!db.keys || !db.keys[key]) {
      return NextResponse.json({ success: false, msg: "Invalid key" });
    }

    const keyInfo = db.keys[key];

    if (keyInfo.usedBy && keyInfo.usedBy !== userId) {
      return NextResponse.json({ success: false, msg: "This key is already in use" });
    }

    if (keyInfo.usedBy === null) {
      keyInfo.usedBy = userId;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, msg: "Server error" });
  }
}