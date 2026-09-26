import { z } from "zod";
import { authenticatedUser } from "@/lib/auth";
import { executeBattle, GameError } from "@/lib/battleService";

export const runtime = "nodejs";
export const maxDuration = 60;
const commandSchema = z.object({
  attackerTroopId: z.uuid(), defenderTroopId: z.uuid(), requestKey: z.uuid(),
}).strict();

export async function POST(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
    let body: unknown;
    try { body = await request.json(); }
    catch { return Response.json({ error: "올바른 JSON이 필요합니다." }, { status: 400 }); }
    const parsed = commandSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "부대 ID와 요청 키는 UUID여야 합니다." }, { status: 400 });
    const result = await executeBattle(user.id, parsed.data);
    return Response.json(result, { status: result.replayed ? 200 : 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof GameError) return Response.json({ error: error.message }, { status: error.status });
    // Never return connection strings, tokens, or raw ORM diagnostics.
    console.error("battle_failed", error instanceof Error ? error.name : "unknown");
    return Response.json({ error: "전투를 처리하지 못했습니다. 동일 요청 키로 재시도하세요." }, { status: 500 });
  }
}
