import db from "../database/sqlite";

const asyncFs = require("fs/promises");

const path = require("path");

const deleteOldFiles = async () => {
    // get all files where uploaded_at is older than 24h
    const files = await db.all(`select id from files where uploaded_at < ?`, [
        Date.now() - 60 * 60 * 24,
    ]);

    // delete files
    for await (const file of files) {
        await db.run(`delete from files where id = ?`, [file.id]);
        // delete from fs
        await asyncFs.unlink(path.resolve("./public/" + file.id));
    }
};

export default deleteOldFiles;