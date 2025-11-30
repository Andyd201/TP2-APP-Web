// Script pour migrer les dates des prêts existants (a été nécessaire car sinon les prêts créés avant l'ajout des dates avaient des valeurs nulles)

// Importation de la connexion db depuis DBclient.js
const {db} = require('./DBclient');


// Fonction pour migrer les dates des prêts existants
async function migrerDates() {
    try {
        // Récupérer tous les prêts sans date
        const pretsSansDates = await db("Prets")
            .whereNull("dateDebut") // prêts sans dateDebut
            .orWhereNull("dateEcheance"); // prêts sans dateEcheance
        
        console.log(`${pretsSansDates.length} prêt(s) à mettre à jour...`); // length pour le nombre d'éléments dans un tableau
        
        // Mettre à jour chaque prêt avec des dates par défaut
        let compteur = 0; // compteur pour le nombre de prêts mis à jour
        for (const pret of pretsSansDates) {
            // Utiliser la date actuelle comme date de début par défaut
            const dateDebut = new Date();
            const dateEcheance = new Date();
            dateEcheance.setMonth(dateEcheance.getMonth() + parseInt(pret.dureeMois)); // sert à calculer la date d'échéance en ajoutant la durée du prêt en mois
            
            // Mettre à jour le prêt dans la base de données
            await db("Prets")
                .where('id', pret.id)
                .update({
                    dateDebut: dateDebut.toISOString().split('T')[0], // format YYYY-MM-DD
                    dateEcheance: dateEcheance.toISOString().split('T')[0] // format YYYY-MM-DD
                });
            compteur++; // incrémenter le compteur
            console.log(`Prêt #${pret.id} mis à jour`);
        }
        
        // envoie un message de succès
        console.log(`${compteur} prêt(s) mis à jour avec succès !`);
        process.exit(0); // termine le processus avec succès
    // vient attraper les erreurs
    } catch (err) {
        console.error("Erreur lors de la migration:", err);
        process.exit(1); // termine le processus avec une erreur
    }
}

// appel de la fonction de migration
migrerDates();
