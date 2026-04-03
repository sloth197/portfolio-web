import { NextRequest } from "next/server";
import { proxyAdminAuthRequest } from "../_proxy";

export async function GET(request: NextRequest): Promise<Response> {
  return proxyAdminAuthRequest(request, "/api/admin/auth/session", "GET");
}
