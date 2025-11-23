// Importation de la connexion db depuis DBclient.js
const {db} = require('./DBclient')

//---------------------------------------------- création de la table Prets ----------------------------------------------//

async function createTablePrets() { // asynnc et await pour les operations asynchrones
    const exists = await db.schema.hasTable("Prets"); // verifie si la table existe
    if(!exists){ // si elle n'existe pas, on la cree
        await db.schema.createTable("Prets", (table)=>{ // await pour attendre la creation de la table
            table.increments("id").primary(); // identifiant unique pour chaque prêt
            table.integer("client_id").unsigned().notNullable(); // Clé étrangère vers Clients (identifiant du client)
            table.foreign("client_id").references("id").inTable("Clients").onDelete("CASCADE"); // Relation avec Clients (suppression en cascade permettant de supprimer les prêts associés si un client est supprimé)
            table.float("montantPret").notNullable();
            table.integer("dureeMois").notNullable();
            table.float("tauxInteret").notNullable();
        });
        console.log("Table 'Prets' cree..");
    }
}

//---------------------------------------------- exportation de la fonction createTablePrets ----------------------------------------------//
module.exports = {createTablePrets};