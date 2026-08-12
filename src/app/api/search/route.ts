import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import {
  searchVideos,
  parseISODurationToSeconds,
  formatDuration,
  YouTubeApiError,
} from "@/lib/youtube";
import type { VideoResult } from "@/types/video";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const query: string | undefined = body?.query?.trim();

  if (!query) {
    return NextResponse.json({ error: "EMPTY_QUERY", message: "Describe the video first." }, { status: 400 });
  }

  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!setting?.youtubeApiKeyEncrypted) {
    return NextResponse.json(
      { error: "NO_KEY", message: "Connect a YouTube API key first." },
      { status: 400 }
    );
  }

  let apiKey: string;
  try {
    apiKey = decrypt(setting.youtubeApiKeyEncrypted);
  } catch {
    return NextResponse.json(
      { error: "KEY_ERROR", message: "The stored key could not be read. Reconnect it." },
      { status: 500 }
    );
  }

  try {
    const { items, nextPageToken } = await searchVideos(apiKey, {
      query,
      duration: body.duration,
      order: body.order,
      safeSearch: body.safeSearch,
      publishedAfter: body.publishedAfter,
      pageToken: body.pageToken,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: VideoResult[] = items.map((item: any) => {
      const seconds = parseISODurationToSeconds(item.contentDetails?.duration);
      return {
        id: item.id,
        title: item.snippet?.title ?? "Untitled",
        channelTitle: item.snippet?.channelTitle ?? "",
        thumbnailUrl:
          item.snippet?.thumbnails?.medium?.url ??
          item.snippet?.thumbnails?.default?.url ??
          "",
        durationSeconds: seconds,
        durationLabel: formatDuration(seconds),
        viewCount: Number(item.statistics?.viewCount ?? 0),
        publishedAt: item.snippet?.publishedAt ?? "",
      };
    });

    await prisma.searchHistory.create({
      data: {
        query,
        duration: body.duration ?? null,
        sortOrder: body.order ?? null,
        safeSearch: body.safeSearch ?? null,
        publishedAfter: body.publishedAfter ? new Date(body.publishedAfter) : null,
        resultCount: results.length,
      },
    });

    return NextResponse.json({ results, nextPageToken: nextPageToken ?? null });
  } catch (err) {
    if (err instanceof YouTubeApiError) {
      if (err.reason === "quotaExceeded") {
        return NextResponse.json(
          { error: "QUOTA", message: "Daily quota for this API key is used up. Try again tomorrow." },
          { status: 429 }
        );
      }
      if (err.reason === "keyInvalid" || err.status === 400) {
        return NextResponse.json(
          { error: "BAD_KEY", message: "That API key was rejected. Check it in the Signal Source panel." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "YOUTUBE_ERROR", message: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "UNKNOWN", message: "Search failed unexpectedly." },
      { status: 500 }
    );
  }
}
