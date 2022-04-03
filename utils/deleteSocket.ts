import Client from "../database/redis";

export default async (socketId: string) => {
    // store socket id with TTL of 15
    await Client.del(socketId);
    await Client.del(`${socketId}_username`);
};
