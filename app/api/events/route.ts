import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { insertEvent } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Try writing to MongoDB if configured
    try {
      await insertEvent({ ...data, timestamp: new Date() });
      return NextResponse.json({ ok: true, stored: "mongodb" });
    } catch (e) {
      // fallback to file storage
      const dataFolder = path.join(process.cwd(), ".data");
      if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder);
      const file = path.join(dataFolder, "events.json");
      const existing = fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file, "utf-8"))
        : [];
      existing.push({ ...data, timestamp: new Date().toISOString() });
      fs.writeFileSync(file, JSON.stringify(existing, null, 2));
      return NextResponse.json({ ok: true, stored: "file" });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
