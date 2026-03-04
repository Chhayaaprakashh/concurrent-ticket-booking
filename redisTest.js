import { createClient } from "redis";

const client = createClient();

client.on("error", err => console.log("Redis error:", err));

await client.connect();

await client.set("test", "Redis working!");
const value = await client.get("test");

console.log(value);

await client.quit();