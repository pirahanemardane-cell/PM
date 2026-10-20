import { NextResponse } from "next/server";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/request-id";
import { logger } from "@/lib/logger";

export function beginApiRequest(req: Request) {
  const requestId = resolveRequestId(req.headers.get(REQUEST_ID_HEADER));
  const log = logger.withRequestId(requestId);
  return { requestId, log };
}

export function apiJson(
  body: unknown,
  init: { status?: number; requestId: string; headers?: Record<string, string> },
) {
  const headers: Record<string, string> = {
    [REQUEST_ID_HEADER]: init.requestId,
    ...(init.headers || {}),
  };
  return NextResponse.json(body, { status: init.status ?? 200, headers });
}
