"use server";

import { config } from "dotenv";
import path from "path";

const rootDir = process.cwd();
const envFiles = [".env.local", ".env"].map((file) =>
  path.resolve(rootDir, file)
);

for (const envPath of envFiles) {
  config({ path: envPath, override: true });
}

import "./server";
