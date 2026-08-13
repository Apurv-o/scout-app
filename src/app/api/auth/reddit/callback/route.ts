import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  // TODO: Implement OAuth code exchange:
  // 1. Verify 'state' matches session
  // 2. POST to https://www.reddit.com/api/v1/access_token
  // 3. Store token securely (e.g., encrypted cookie or database)
  // 4. Redirect to home page

  return NextResponse.json({ message: "Callback received", code, state });
}
