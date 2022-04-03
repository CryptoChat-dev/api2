import Client from "../database/redis";

export const keepRoomAlive = async (roomId: string) => {
    // reset TTL with 24h
    await Client.expire(roomId, 60 * 60 * 24);
}