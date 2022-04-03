import { decrementRoomCount, incrementRoomCount } from "./utils/roomCount";
import type { Socket } from "socket.io";

import { config } from "dotenv";

config();

import express = require("express");
const app = express();
const server = require("http").Server(app);
import compression = require("compression");
import minify = require("express-minify");

import Client from "./database/redis";

import doesRoomExist from "./utils/roomExists";

import createRoom from "./utils/createRoom";

import storeSocketId from "./utils/storeSocket";

import { keepRoomAlive } from "./utils/keepAlive";

app.use(compression());
app.use(minify());

interface options {
    cors: { origin: string; methods: string[]; credentials: boolean };
}

let socketioOptions: options = {} as options;

if (process.env.USE_CORS === "true") {
    socketioOptions.cors = {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
    };
}

const io = require("socket.io")(server, socketioOptions);

interface encryptionData {
    iv: string;
    data: string;
}

io.on("connection", (socket: Socket) => {
    socket.on(
        "join",
        async (data: {
            roomName: string;
            username: { iv: string; data: string };
        }) => {
            // Listens for join events from clients
            if (typeof data === "object") {
                // Make sure the data received is a JS object
                var now = new Date();
                if (!data.roomName || !data.username) {
                    // Make sure the data received is a JS object
                    console.log(`${now} - Event had invalid fields.`);
                    return;
                }
                // Join the socket to the requested room
                socket.join(data.roomName);
                io.to(data.roomName).emit("join response", {
                    // Broadcasts the username as a join response to the Socket room
                    username: data.username,
                    id: socket.id,
                });

                if (!(await doesRoomExist(data.roomName))) {
                    // If the room doesn't exist, create it
                    await createRoom(data.roomName);
                } else {
                    await incrementRoomCount(data.roomName);
                }

                await storeSocketId(
                    socket.id,
                    data.roomName,
                    JSON.stringify(data.username)
                );

                return;
            }
            console.log(`${now} - Event was rejected: ${data}`);
        }
    );

    socket.on(
        "chat event",
        async (data: {
            roomName: string;
            username: encryptionData;
            message: encryptionData;
        }) => {
            if (typeof data !== "object") {
                return;
            }

            if (!data.roomName || !data.username || !data.message) {
                return;
            }

            await keepRoomAlive(data.roomName);

            io.to(data.roomName).emit("chat response", {
                username: data.username,
                message: data.message,
            });
        }
    );

    socket.on("disconnect", async () => {
        // on disconnect, check if the socket is in a room
        // if so, decrement the room count and broadcast leave
        const socketRoom: string = (await Client.get(socket.id)) as string;
        if (!socketRoom) {
            return;
        }

        await Client.del(socket.id);

        await decrementRoomCount(socketRoom);

        const clientUsername: string = (await Client.get(
            `${socket.id}_username`
        )) as string;

        io.to(socketRoom).emit("leave response", {
            id: socket.id,
            username: clientUsername,
        });
    });
});

server.listen(process.env.PORT, process.env.HOST, () => {
    console.log(`listening on ${process.env.HOST}:${process.env.PORT}`);
});
