import { redis } from "@/lib/redis";

async function main() {
  const entries = await redis.lrange("post:views:pending", 0, -1);
  console.log("Raw entries:", entries);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
