const knex = require('knex')

// creation de la base de donne
const db = knex({
    client: 'sqlite3',
    connection: {
        filename: "./BESloan.sqlite3",
    },
    useNullAsDefault: null
});


async function createTable() {
    const exists = await db.schema.hasTable("Clients");
    if(!exists){
        await db.schema.createTable("Clients", (table)=>{
            table.increments("id").primary();
            table.string("nom").notNullable();
            table.string("Prenom").notNullable();
            table.integer("Telephone").notNullable();
            table.string("email").notNullable();
            table.string("adresse").notNullable();
        });
        console.log("Table 'client' cree..");
    }
    
}

module.exports = {db, createTable};

