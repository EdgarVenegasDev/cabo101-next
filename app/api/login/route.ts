//app/api/login/route.ts

import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  console.log("========== LOGIN ==========");
  console.log("EMAIL RECIBIDO:", JSON.stringify(email));
  console.log("EMAIL ENV:", JSON.stringify(process.env.ADMIN_EMAIL));

  console.log("PASSWORD RECIBIDO:", JSON.stringify(password));
  console.log("PASSWORD ENV:", JSON.stringify(process.env.ADMIN_PASSWORD));

  console.log(
    "EMAIL MATCH:",
    email === process.env.ADMIN_EMAIL
  );

  console.log(
    "PASSWORD MATCH:",
    password === process.env.ADMIN_PASSWORD
  );

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    console.log("LOGIN FAILED");
    return NextResponse.json(
      { success: false },
      { status: 401 }
    );
  }

  console.log("LOGIN SUCCESS");

  const token = jwt.sign(
    {
      admin: true,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "7d",
    }
  );

  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set(
    "admin_token",
    token,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    }
  );

  return response;
}