import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function GET() {
  if (process.env.YOUTUBE_API_KEY?.trim()) {
    return NextResponse.json({ connected: true, youtubeConnected: true });
  }

  try {
    const setting = await prisma.setting.findUnique({ where: { id: 1 } });
    return NextResponse.json({
      connected: true,
      youtubeConnected: Boolean(setting?.youtubeApiKeyEncrypted),
    });
  } catch {
    return NextResponse.json({ connected: true, youtubeConnected: false });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const apiKey: string | undefined = body?.apiKey?.trim();

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required." }, { status: 400 });
  }

  const encrypted = encrypt(apiKey);
  await prisma.setting.upsert({
    where: { id: 1 },
    update: { youtubeApiKeyEncrypted: encrypted },
    create: { id: 1, youtubeApiKeyEncrypted: encrypted },
  });

  return NextResponse.json({ connected: true });
}

export async function DELETE() {
  await prisma.setting.upsert({
    where: { id: 1 },
    update: { youtubeApiKeyEncrypted: null },
    create: { id: 1, youtubeApiKeyEncrypted: null },
  });
  return NextResponse.json({ connected: false });
}
