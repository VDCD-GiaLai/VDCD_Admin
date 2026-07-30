import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ API_BASE_URL: process.env.API_BASE_URL });
}
