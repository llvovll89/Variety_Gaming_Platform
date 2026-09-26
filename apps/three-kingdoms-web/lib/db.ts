import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
const globalDb = globalThis as unknown as { gameDb?: PrismaClient };
export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL 설정이 필요합니다.");
  return globalDb.gameDb ??= new PrismaClient({ adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 5000,
  }) });
}
