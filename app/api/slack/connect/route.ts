import { NextRequest, NextResponse } from "next/server";
import { getSlackAuthUrl } from "@/lib/slack";

export async function GET(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https") ? "https" : "http");
  const baseUrl = host ? `${proto}://${host}` : request.nextUrl.origin;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || baseUrl}/api/slack/callback`;
  const authUrl = getSlackAuthUrl(redirectUri);
  return NextResponse.redirect(authUrl);
}
