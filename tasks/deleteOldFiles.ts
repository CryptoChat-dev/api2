import db from "../database/sqlite";

const asyncFs = require("fs/promises");

const path = require("path");

const deleteOldFiles = async () => {
    // get all files where uploaded_at is older than 24h
    db.each(
        `select id from files where uploaded_at < ?`,
        [Date.now() - 60 * 60 * 24],
        async (err, row) => {
            if (err) return;
            await db.run(`delete from files where id = ?`, [row.id]);
            // delete from fs
            await asyncFs.unlink(path.resolve("./public/" + row.id));
        }
    );
};

export default deleteOldFiles;
