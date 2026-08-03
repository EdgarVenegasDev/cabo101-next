//app/api/search/route.ts

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { from, to, date, passengers } = body;

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        from,
        to,
        date,
        passengers,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}