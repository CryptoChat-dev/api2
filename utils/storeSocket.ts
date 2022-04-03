import Client from "../database/redis";

export default async (socketId: string, roomId: string) => {
    // store socket id with TTL of 15
    await Client.set(socketId, roomId);
    await Client.expire(socketId, 15);
}