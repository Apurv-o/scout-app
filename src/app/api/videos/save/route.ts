import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: "Missing video id." }, { status: 400 });
  }

  const saved = await prisma.savedVideo.upsert({
    where: { videoId: body.id },
    update: {},
    create: {
      videoId: body.id,
      title: body.title ?? "",
      channelTitle: body.channelTitle ?? "",
      thumbnailUrl: body.thumbnailUrl ?? "",
      durationSeconds: body.durationSeconds ?? 0,
      durationLabel: body.durationLabel ?? "",
      viewCount: body.viewCount ? BigInt(body.viewCount) : null,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
    },
  });

  return NextResponse.json({ saved: true, id: saved.videoId });
}

export async function DELETE(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId." }, { status: 400 });
  }
  await prisma.savedVideo.delete({ where: { videoId } }).catch(() => null);
  return NextResponse.json({ saved: false });
}
