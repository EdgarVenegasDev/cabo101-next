//app/api/webhooks/route.ts

import { webhooks } from "@/lib/webhooksStore";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(webhooks);
}