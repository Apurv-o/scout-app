import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { searchAllSources } from "@/lib/videoSources";
import type { VideoSource } from "@/types/video";

const SAFE_SEARCH_VALUES = new Set(["none", "moderate", "strict"]);
const SOURCE_VALUES = new Set(["all", "youtube", "dailymotion", "peertube", "archive", "reddit"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const query: string | undefined = body?.query?.trim();
  const safeSearch = SAFE_SEARCH_VALUES.has(body?.safeSearch) ? body.safeSearch : "none";
  const regionCode = typeof body?.regionCode === "string" ? body.regionCode : "worldwide";
  const source: VideoSource = SOURCE_VALUES.has(body?.source) ? body.source : "all";

  if (!query) {
    return NextResponse.json({ error: "EMPTY_QUERY", message: "Describe the video first." }, { status: 400 });
  }

  const configuredApiKey = process.env.YOUTUBE_API_KEY?.trim();
  let apiKey = configuredApiKey;

  if (!apiKey) {
    try {
      const setting = await prisma.setting.findUnique({ where: { id: 1 } });
      if (setting?.youtubeApiKeyEncrypted) {
        apiKey = decrypt(setting.youtubeApiKeyEncrypted);
      }
    } catch (err) {
      console.error("Could not load stored YouTube key", err);
    }
  }

  try {
    const { results, nextPageToken, notices } = await searchAllSources({
      query,
      duration: body.duration,
      order: body.order,
      safeSearch,
      regionCode,
      source,
      publishedAfter: body.publishedAfter,
      pageToken: body.pageToken,
      youtubeApiKey: apiKey,
    });

    try {
      await prisma.searchHistory.create({
        data: {
          query,
          duration: body.duration ?? null,
          sortOrder: body.order ?? null,
          safeSearch,
          publishedAfter: body.publishedAfter ? new Date(body.publishedAfter) : null,
          resultCount: results.length,
        },
      });
    } catch (err) {
      console.error("Could not save search history", err);
    }

    return NextResponse.json({ results, nextPageToken, notices });
  } catch (err) {
    console.error("Multi-source search failed", err);
    return NextResponse.json(
      { error: "UNKNOWN", message: "Search failed unexpectedly." },
      { status: 500 }
    );
  }
}
