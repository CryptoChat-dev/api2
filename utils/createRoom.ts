import Client from "../database/redis";

export default async (roomId: string) => {
    // store socket id with TTL of 15
    await Client.set(roomId, "1");
    await Client.expire(
        roomId,
        //24h TTL
        60 * 60 * 24
    );
};
