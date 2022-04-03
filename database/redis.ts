// TypeScript
import { Tedis, TedisPool } from "tedis";

let tedisClient: Tedis;

tedisClient = new Tedis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
});
console.log("Connected to Redis!")

export default tedisClient;