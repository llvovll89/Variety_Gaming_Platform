import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/battle/route";

test("인증 토큰이 없으면 DB 연결 없이 401", async () => {
  const response = await POST(new Request("http://localhost/api/battle", { method: "POST", body: "{}" }));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "로그인이 필요합니다." });
});
