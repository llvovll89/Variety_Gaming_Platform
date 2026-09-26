import { readFileSync, writeFileSync } from "node:fs";
const prisma = new URL("../prisma/", import.meta.url);
writeFileSync(new URL("bootstrap.sql", prisma), "-- Generated schema + reviewed constraints. Apply once to an empty database.\nBEGIN;\n"
  + readFileSync(new URL("schema.generated.sql", prisma), "utf8") + "\n"
  + readFileSync(new URL("constraints.sql", prisma), "utf8") + "\nCOMMIT;\n");
