import { NextRequest } from "next/server";
import { proxyAdminAuthRequest } from "../_proxy";

export async function POST(request: NextRequest): Promise<Response> {
  return proxyAdminAuthRequest(request, "/api/admin/auth/login", "POST");
}
