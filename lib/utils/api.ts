import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export function rpcError(error: { message: string; code?: string }) {
  if (error.code === "23505")
    return NextResponse.json({ error: "Your organisation already has an order for this quarter." }, { status: 409 });
  return NextResponse.json({ error: error.message }, { status: 409 });
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}