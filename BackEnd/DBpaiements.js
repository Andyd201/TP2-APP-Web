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
            table.string("modePaiement"); // mode de paiement: Espèces, Carte bancaire, Virement, Chèque, Mobile Money
            table.string("statut").notNullable().defaultTo("En attente"); // statut: Effectué, En attente, Échoué
            table.text("notes"); // notes supplémentaires
            table.timestamp("createdAt").defaultTo(db.fn.now()); // date de création du paiement
        });
        console.log("Table 'Paiements' cree..");
    } else {
        // Si la table existe, vérifier et ajouter la colonne modePaiement si elle est manquante
        const hasModePaiement = await db.schema.hasColumn("Paiements", "modePaiement");
        if (!hasModePaiement) { // si la colonne modePaiement n'existe pas
            await db.schema.alterTable("Paiements", (table) => { // alterTable pour modifier la table existante
                table.string("modePaiement"); // ajoute la colonne modePaiement
                console.log("Colonne 'modePaiement' ajoutée à la table Paiements"); 
            });
        }
    }
}

//---------------------------------------------- exportation de la fonction createTablePaiements ----------------------------------------------//
module.exports = {createTablePaiements};
