import Client from "../database/redis";

export const keepSocketAlive = async (socketId: string) => {
    // store socket id with TTL of 15
    await Client.expire(socketId, 15);
}

export const keepRoomAlive = async (roomId: string) => {
    // reset TTL with 24h
    await Client.expire(roomId, 60 * 60 * 24);
}