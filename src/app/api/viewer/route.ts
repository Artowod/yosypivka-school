import { getActor } from "@/lib/session";
import { authConfigured } from "@/lib/env";
import { logError } from "@/lib/logging";
export async function GET() {
  try {
    return Response.json(
      { actor: await getActor(), authConfigured },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    await logError("viewer", error);
    return Response.json(
      { actor: null, authConfigured: false },
      { status: 503 },
    );
  }
}
