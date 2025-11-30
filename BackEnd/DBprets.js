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
            table.date("dateDebut"); // Date de début du prêt
            table.date("dateEcheance"); // Date d'échéance du prêt
            table.string("statut").defaultTo("actif"); // Statut du prêt: actif, remboursé, en_retard
        });
        console.log("Table 'Prets' cree..");
    } else {
        // Si la table existe, vérifier et ajouter les colonnes manquantes
        const hasDateDebut = await db.schema.hasColumn("Prets", "dateDebut"); // vérifie si la colonne dateDebut existe
        const hasDateEcheance = await db.schema.hasColumn("Prets", "dateEcheance"); // vérifie si la colonne dateEcheance existe
        const hasStatut = await db.schema.hasColumn("Prets", "statut"); // vérifie si la colonne statut existe
        
        // si une des colonnes n'existe pas, on l'ajoute
        if (!hasDateDebut || !hasDateEcheance || !hasStatut) {
            await db.schema.alterTable("Prets", (table) => { // alterTable pour modifier la table existante
                if (!hasDateDebut) { // si la colonne dateDebut n'existe pas
                    table.date("dateDebut"); // ajoute la colonne dateDebut
                    console.log("Colonne 'dateDebut' ajoutée à la table Prets");
                }
                if (!hasDateEcheance) { // si la colonne dateEcheance n'existe pas
                    table.date("dateEcheance"); // ajoute la colonne dateEcheance
                    console.log("Colonne 'dateEcheance' ajoutée à la table Prets");
                }
                if (!hasStatut) { // si la colonne statut n'existe pas
                    table.string("statut").defaultTo("actif"); // ajoute la colonne statut avec une valeur par défaut "actif"
                    console.log("Colonne 'statut' ajoutée à la table Prets");
                }
            });
        }
    }
}

//---------------------------------------------- exportation de la fonction createTablePrets ----------------------------------------------//
module.exports = {createTablePrets};