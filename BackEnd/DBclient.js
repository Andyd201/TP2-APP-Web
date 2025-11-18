const { table } = require('console');
const { connect } = require('http2')
const knew = require('knex')
const { Client } = require('undici-types')

// creation de la base de donne
const db = knex({
    Client: 'sqlite3',
    connection: {
        filename: "./BESloan.sqlite3",
    },
    useNullAsDefault: null
});


async function createTable() {
    const exists = await db.shema.hasTable("Clients");
    if(!exists){
        await db.shema.createTable("Clients", (table)=>{
            table.increments("id").primary();
            table.string("nom").notNullable();
            table.string("Prenom").notNullable();
            table.number("Telephone").notNullable();
            table.string("email").notNullable();
            table.string("adresse").notNullable();
        });
        console.log("Table 'client' cree..");
    }
    
}

module.exports = {db, createTable};

