const knex = require('knex');


const db = knex({
    client: 'sqlite3',
    connection: {
        filename: "./BESloan.sqlite3",
    },
    useNullAsDefault: null
});

async function createTableAdministrateurs() {
    const exists = await db.schema.hasTable("Administrateurs");
    if(!exists){
        await db.schema.createTable("Administrateurs", (table)=>{
            table.increments("id").primary();
            table.string("nom").notNullable();
            table.string("email").notNullable().unique();
            table.string("motDePasse").notNullable();
            table.timestamp("createdAt").defaultTo(db.fn.now());
        });
        console.log("Table 'Administrateurs' cree..");
    }
}

module.exports = {db, createTableAdministrateurs};