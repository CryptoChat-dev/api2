import Client from "../database/redis";

export default async (roomId: string) => {
    // get room
    const room: string = await Client.get(roomId) as string;
    return room !== "";
}