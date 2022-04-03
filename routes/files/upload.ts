// upload endpoint

// accept upload of binary data, store it into the public folder and return the uuid

import { v4 as uuidv4 } from "uuid";

import type { Request, Response } from "express";

import db from "../../database/sqlite";

const asyncFs = require("fs/promises");

const path = require("path");

const handler = async (req: Request, res: Response) => {
    // get encrypted file
    const file = req.file;

    // make sure file is not empty
    if (!file) {
        return res.status(422).json({
            error: "No file uploaded",
        });
    }

    // make sure file is not greater than 50 mb
    if (file.size > 50000000) {
        return res.status(419).json({
            error: "File is too large",
        });
    }

    const fileUuid: string = uuidv4();

    // store file in public folder
    await asyncFs.writeFile(path.resolve("./public/" + fileUuid), file.buffer);

    // add file to database
    await db.run(`insert into files (id, uploaded_at) values (?, ?)`, [fileUuid, Date.now()]);

    res.json({
        uuid: fileUuid,
    });
};

export default handler;
