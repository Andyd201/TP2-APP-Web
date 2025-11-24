// Importation de la connexion db depuis DBclient.js
const {db} = require('./DBclient')

//---------------------------------------------- création de la table Paiements ----------------------------------------------//

async function createTablePaiements() {
    const exists = await db.schema.hasTable("Paiements");
    if(!exists){
        await db.schema.createTable("Paiements", (table)=>{
            table.increments("id").primary(); // identifiant unique pour chaque paiement
            table.integer("pret_id").unsigned().notNullable(); // Clé étrangère vers Prets
            table.foreign("pret_id").references("id").inTable("Prets").onDelete("CASCADE"); // Relation avec Prets (suppression en cascade)
            table.float("montant").notNullable(); // montant du paiement
            table.date("datePaiement").notNullable(); // date du paiement
            table.string("statut").notNullable().defaultTo("En attente"); // statut: Effectué, En attente, Échoué
            table.text("notes"); // notes supplémentaires
            table.timestamp("createdAt").defaultTo(db.fn.now()); // date de création du paiement
        });
        console.log("Table 'Paiements' cree..");
    }
}

//---------------------------------------------- exportation de la fonction createTablePaiements ----------------------------------------------//
module.exports = {createTablePaiements};
