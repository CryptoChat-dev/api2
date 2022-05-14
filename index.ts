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

import deleteSocket from "./utils/deleteSocket";

import "./database/sqlite";

import deleteOldFiles from "./tasks/deleteOldFiles";

import cors from "cors";

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

    app.use(require("cors")());
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
            key: string;
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
                key: data.key,
                uid: socket.id,
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

        const clientUsername: string = (await Client.get(
            `${socket.id}_username`
        )) as string;

        io.to(socketRoom).emit("leave response", {
            id: socket.id,
            username: clientUsername,
        });

        await deleteSocket(socket.id);

        await decrementRoomCount(socketRoom);
    });

    socket.on(
        "file event",
        async (data: {
            roomName: string;
            username: { iv: string; data: string };
            id: string;
            iv: string;
            name: { iv: string; data: string };
            type: { iv: string; data: string };
            key: { iv: string; data: string };
        }) => {
            if (
                !data.roomName ||
                !data.username ||
                !data.id ||
                !data.iv ||
                !data.name ||
                !data.type ||
                !data.key
            ) {
                return;
            }

            if (!(await doesRoomExist(data.roomName))) {
                return;
            }

            await keepRoomAlive(data.roomName);

            io.to(data.roomName).emit("file response", {
                username: data.username,
                id: data.id,
                iv: data.iv,
                name: data.name,
                type: data.type,
                key: data.key,
                uid: socket.id,
            });
        }
    );
});

import UploadEndpoint from "./routes/files/upload";

const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage });

app.post("/upload", cors(), upload.single("efile"), UploadEndpoint);

app.use("/efile", express.static("public"));

// call deleteOldFiles every 1m
setInterval(deleteOldFiles, 60 * 1000);

server.listen(process.env.PORT, process.env.HOST, () => {
    console.log(`listening on ${process.env.HOST}:${process.env.PORT}`);
});
