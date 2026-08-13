import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hydrateVideoLinks } from "@/lib/videoLinks";

export async function GET() {
  const rows = await prisma.savedVideo.findMany({ orderBy: { savedAt: "desc" } });

  const results = rows.map((v) =>
    hydrateVideoLinks({
      id: v.videoId,
      title: v.title,
      channelTitle: v.channelTitle,
      thumbnailUrl: v.thumbnailUrl,
      durationSeconds: v.durationSeconds,
      durationLabel: v.durationLabel,
      viewCount: v.viewCount ? Number(v.viewCount) : 0,
      publishedAt: v.publishedAt ? v.publishedAt.toISOString() : "",
    })
  );

  return NextResponse.json({ results });
}
