import { NextResponse } from "next/server";

export function json(data, init) {
  return NextResponse.json(data, init);
}

export function error(message, status = 500) {
  return NextResponse.json({ error: message }, { status });
}
