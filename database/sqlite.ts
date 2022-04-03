const sqlite3 = require("sqlite3");

let db = new sqlite3.Database("./cryptochat3.db");

// if "files" table is not created, create it
db.run(
    `CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY NOT NULL UNIQUE, uploaded_at integer not null)`
);

export default db;
