import Client from "../database/redis";
import createRoom from "./createRoom";

export const incrementRoomCount = async (roomId: string) => {
    // get room
    const room: string = (await Client.get(roomId)) as string;

    if (room === "") {
        await createRoom(roomId);
        return;
    }
    // increment room value
    await Client.set(roomId, (parseInt(room) + 1).toString());
};

export const decrementRoomCount = async (roomId: string) => {
    // get room
    const room: string = (await Client.get(roomId)) as string;

    if (room === "") {
        return;
    }
    // decrement room value
    await Client.set(roomId, (parseInt(room) - 1).toString());
};

export const getRoomCount = async (roomId: string) => {
    // get room
    const room: string = (await Client.get(roomId)) as string;

    if (room === "") {
        return 0;
    }
    // get room value
    return parseInt(room);
};
