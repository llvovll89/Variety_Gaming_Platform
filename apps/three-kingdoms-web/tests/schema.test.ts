import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("초기 SQL 적용, DB 제약, RLS", async () => {
  const db = new PGlite();
  try {
    await db.exec(readFileSync(new URL("../prisma/bootstrap.sql", import.meta.url), "utf8"));
    const tables = await db.query<{ tablename: string; rowsecurity: boolean }>(
      "select tablename, rowsecurity from pg_tables where schemaname = 'public'");
    assert.equal(tables.rows.length, 8);
    assert.ok(tables.rows.every(t => t.rowsecurity));
    await db.exec(`INSERT INTO "User" (id, name) VALUES ('00000000-0000-4000-8000-000000000001', '군주');`);
    await assert.rejects(db.exec(`INSERT INTO "Castle" (id, "userId", gold) VALUES
      ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001',-1);`), /castle_resources/);
    await assert.rejects(db.exec(`INSERT INTO "Troop" (id, name, "isNpc") VALUES
      ('00000000-0000-4000-8000-000000000003','잘못된 부대',false);`), /troop_values/);
    await db.exec(`CREATE ROLE game_client; GRANT USAGE ON SCHEMA public TO game_client;
      GRANT SELECT ON "User" TO game_client; SET ROLE game_client;`);
    assert.equal((await db.query('SELECT * FROM "User"')).rows.length, 0);
  } finally { await db.close(); }
});
