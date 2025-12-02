const express = require('express');
const path = require('path')
const port = 3000


const {db, createTable} = require('./DBclient')
const {createTablePrets} = require('./DBprets')
const {createTablePaiements} = require('./DBpaiements')
const {createTableAdministrateurs} = require('./DBadministrateur')


const app = express()

app.use(express.json())

// Ajout des en-têtes CORS pour permettre les requêtes depuis le frontend (car sinon faisait des erreurs de politique de même origine et envoyait des requêtes bloquées)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.static(path.join(__dirname, '../Client')));

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, "../Client", "Clients.html"));

});

app.post('/addClients', async (req, res)=>{
    try{
        const {nom, Prenom, Telephone, email, adresse} = req.body;

        if(!nom || !Prenom || !Telephone || !email || !adresse){
            return res.status(400).json({error: "champ 'nom', 'Prenom', 'Telephone', 'email', 'adresse' obligation"})
        }

        const client = {
            nom: nom,
            Prenom: Prenom,
            Telephone: Telephone,
            email: email,
            adresse: adresse
        }
        await db("Clients").insert(client);
        res.status(201).json(client);
    }catch(err){
        console.error("Erreur /addClients", err);
      res.status(500).json({error: "Erreur serveur.." })
    }
});

app.get('/allClients', async (req, res)=>{
   try{

    const products = await db("Clients").select("*").orderBy("id", "desc");
       res.status(200).json(products)
   }catch(err){
       console.error("Erreur /allClients", err);
      res.status(500).json({error: "Erreur serveur.." })
   }
})

app.delete('/deleteClient/:id', async (req, res) =>{
   try{
      const {id} = req.params;
      const deleted = await db("Clients").where('id', id).del();
      if (deleted == 0){
      return res.status(404).json({error: "Client introuvable"})
      }
      res.status(200).json({message: "Client supprimé", deleted: deleted})
   }catch(err){
       console.error("Erreur /deleteClient", err);
      res.status(500).json({error: "Erreur serveur.."})
   }
   
})

//========================================= ROUTES POUR LE DASHBOARD (STATISTIQUES) =========================================//

//-------------------------------------- récupération des statistiques du dashboard --------------------------------------//

// Route pour obtenir les statistiques du dashboard
app.get('/statistiques', async (req, res) => {
    try {
        // Compter les prêts actifs
        const pretsActifsResult = await db("Prets")
            .where('statut', 'actif')
            .count('* as count')
            .first();
        
        // Compter les prêts remboursés
        const pretsRemboursesResult = await db("Prets")
            .where('statut', 'rembourse')
            .count('* as count')
            .first();
        
        // Compter les prêts en retard (date d'échéance dépassée et statut actif)
        const pretsEnRetardResult = await db("Prets")
            .where('statut', 'actif')
            .whereRaw("date(dateEcheance) < date('now')") // Prêts en retard
            .count('* as count')
            .first();
        
        // Calculer le montant total prêté
        const montantTotal = await db("Prets").sum('montantPret as total').first();
        
        // Calculer le montant total remboursé
        const montantRemboursResult = await db("Prets")
            .where('statut', 'rembourse')
            .sum('montantPret as total')
            .first();
        
        // Renvoie les statistiques du dashboard
        res.status(200).json({
            pretsActifs: pretsActifsResult.count || 0,
            pretsRembourses: pretsRemboursesResult.count || 0,
            pretsEnRetard: pretsEnRetardResult.count || 0,
            montantTotalPrete: montantTotal.total || 0,
            montantTotalRembourse: montantRemboursResult.total || 0
        });
    // vient attraper les erreurs
    } catch (err) {
        console.error("Erreur /statistiques", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

//-------------------------------------- récupération des clients en retard --------------------------------------//

// Route pour obtenir la liste des clients en retard
app.get('/clientsEnRetard', async (req, res) => {
    try {
        const clientsEnRetard = await db("Prets")
            .join("Clients", "Prets.client_id", "Clients.id") // jointure entre les prêts et les clients
            .select( // sélection des champs à récupérer
                "Clients.id",
                "Clients.Prenom",
                "Clients.nom",
                "Clients.Telephone",
                "Clients.email",
                "Prets.montantPret as montantDu",
                "Prets.dateEcheance",
                db.raw("CAST((julianday('now') - julianday(Prets.dateEcheance)) AS INTEGER) as joursRetard") // calcule le nombre de jours de retard
            )
            .where('Prets.statut', 'actif') // prêts actifs
            .whereRaw("date(Prets.dateEcheance) < date('now')") // Prêts en retard
            .orderBy("joursRetard", "desc"); // tri par nombre de jours de retard
        
        // Renvoie la liste des clients en retard
        res.status(200).json(clientsEnRetard);
    // vient attraper les erreurs
    } catch (err) {
        console.error("Erreur /clientsEnRetard", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

//========================================= ROUTES POUR LES PRÊTS =========================================//


app.get('/', (req, res) =>{ // Route pour servir la page des prêts
    res.sendFile(path.join(__dirname, "../Client", "prets.html")); // Envoie le fichier HTML des prêts
});

//-------------------------------------- récupération de tous les prêts avec informations client --------------------------------------//

app.get('/allPrets', async (req, res) => { // Route pour récupérer tous les prêts
    try {
        const tousLesPrets = await db("Prets").select("*").orderBy("id", "desc");
        
        // Pour chaque prêt, récupérer les infos du client
        for (let i = 0; i < tousLesPrets.length; i++) { // boucle sur tous les prêts
            const client = await db("Clients").where("id", tousLesPrets[i].client_id).first(); // récupère les infos du client
            tousLesPrets[i].Prenom = client ? client.Prenom : "Inconnu"; // ajoute le prénom du client au prêt
            tousLesPrets[i].nom = client ? client.nom : "Inconnu"; // ajoute le nom du client au prêt
        }
        
        // Renvoie la liste complète des prêts avec les infos clients
        res.status(200).json(tousLesPrets);
    // vient attraper les erreurs
    } catch (err) {
        console.error("Erreur /allPrets", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

//-------------------------------------- ajout d'un nouveau prêt --------------------------------------//

app.post('/addPrets', async (req, res) => { // Route pour ajouter un nouveau prêt
    try {
        const { client_id, montantPret, dureeMois, tauxInteret, dateDebut } = req.body; // req.body vient recueillir les données envoyées par le client
        if (!client_id || !montantPret || !dureeMois || !tauxInteret) { // si un des champs est manquant, envoie une erreur 400
            return res.status(400).json({ error: "Champs 'client_id', 'montantPret', 'dureeMois', 'tauxInteret' obligatoires" });
        }
        
        // Calculer la date d'échéance (dateDebut + dureeMois)
        const debut = dateDebut ? new Date(dateDebut) : new Date();
        const echeance = new Date(debut);
        echeance.setMonth(echeance.getMonth() + parseInt(dureeMois));
        
        // Création de l'objet prêt
        const nouveauPret = {
            client_id: client_id,
            montantPret: montantPret,
            dureeMois: dureeMois,
            tauxInteret: tauxInteret,
            dateDebut: debut.toISOString().split('T')[0],
            dateEcheance: echeance.toISOString().split('T')[0],
            statut: 'actif'
        };
        // Insertion du prêt dans la base de données
        const [id] = await db("Prets").insert(nouveauPret);
        nouveauPret.id = id; // Ajout de l'ID généré par la base de données à l'objet prêt
        res.status(201).json(nouveauPret); // Renvoie le prêt créé avec un statut 201
    // gestion des erreurs
    } catch (err) {
        console.error("Erreur /addPrets", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

//-------------------------------------- suppression d'un prêt --------------------------------------//

app.delete('/deletePret/:id', async (req, res) => { // Route pour supprimer un prêt par ID
    try {
        const { id } = req.params; // Récupère l'ID du prêt à supprimer depuis les paramètres de l'URL
        const pretsSupprimes = await db("Prets").where('id', id).del(); // Supprime le prêt de la base de données
        if (pretsSupprimes == 0) { // si aucun prêt n'a été supprimé, renvoie une erreur 404
            return res.status(404).json({ error: "Prêt introuvable" });
        }
        // Renvoie une réponse de succès
        res.status(200).json({ message: "Prêt supprimé", deleted: pretsSupprimes });
    // vient attraper les erreurs
    } catch (err) {
        console.error("Erreur /deletePret/:id", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

//-------------------------------------------- modification d'un prêt --------------------------------------------//
app.put('/updatePret/:id', async (req, res) => { // Route pour modifier un prêt par ID
    try {
        const { id } = req.params; // Récupère l'ID du prêt à modifier depuis les paramètres de l'URL
        const { nomClient, montantPret, dureeMois, tauxInteret } = req.body; // Récupère les nouvelles données du prêt depuis le corps de la requête
        const updatedPret = {
            nomClient: nomClient,
            montantPret: montantPret,
            dureeMois: dureeMois,
            tauxInteret: tauxInteret
        };
        const updated = await db("Prets").where('id', id).update(updatedPret); // Met à jour le prêt dans la base de données
        if (updated == 0) { // si aucun prêt n'a été mis à jour, renvoie une erreur 404
            return res.status(404).json({ error: "Prêt introuvable" });
        }
        // Renvoie une réponse de succès
        res.status(200).json({ message: "Prêt modifié", updated: updated });
    // vient attraper les erreurs
    } catch (err) {
        console.error("Erreur /updatePret/:id", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

//-------------------------------------- mettre à jour les dates des prêts existants (migration) --------------------------------------//

app.post('/migrerDatesPretsExistants', async (req, res) => { // Route pour migrer les dates des prêts existants (faite car problème d'initialisation des dates)
    try {
        // Récupérer tous les prêts sans date
        const pretsSansDates = await db("Prets")
            .whereNull("dateDebut") // où dateDebut est NULL
            .orWhereNull("dateEcheance"); // ou dateEcheance est NULL
        
        let compteur = 0; // Compteur pour le nombre de prêts mis à jour
        for (const pret of pretsSansDates) {
            // Utiliser la date actuelle comme date de début par défaut
            const dateDebut = new Date(); 
            const dateEcheance = new Date();
            dateEcheance.setMonth(dateEcheance.getMonth() + parseInt(pret.dureeMois)); // Calcul de la date d'échéance
            
            // met à jour la base de données avec les nouvelles dates
            await db("Prets")
                .where('id', pret.id)
                .update({
                    dateDebut: dateDebut.toISOString().split('T')[0], // Formatage de la date au format YYYY-MM-DD
                    dateEcheance: dateEcheance.toISOString().split('T')[0] // Formatage de la date au format YYYY-MM-DD
                });
            compteur++; // Incrémentation du compteur
        }
        
        // Renvoie une réponse avec le nombre de prêts mis à jour
        res.status(200).json({ 
            message: `${compteur} prêt(s) mis à jour avec succès`,
            updated: compteur // Nombre de prêts mis à jour
        });
    // vient attraper les erreurs
    } catch (err) {
        console.error("Erreur /migrerDatesPretsExistants", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

//========================================= ROUTES POUR LES PAIEMENTS =========================================//

//-------------------------------------- récupération de tous les paiements --------------------------------------//

app.get('/allPaiements', async (req, res) => {
    try {
        const allPaiements = await db("Paiements").select("*").orderBy("id", "desc");
        res.status(200).json(allPaiements);
    } catch (err) {
        console.error("Erreur /allPaiements", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

//-------------------------------------- ajout d'un nouveau paiement --------------------------------------//

app.post('/addPaiement', async (req, res) => {
    try {
        const { pret_id, montant, datePaiement, modePaiement, statut, notes } = req.body;
        
        console.log('Données reçues:', { pret_id, montant, datePaiement, modePaiement, statut, notes });

        if (!pret_id || !montant || !datePaiement || !statut) {
            return res.status(400).json({ error: "Champs 'pret_id', 'montant', 'datePaiement', 'statut' obligatoires" });
        }

        const nouveauPaiement = {
            pret_id: pret_id,
            montant: montant,
            datePaiement: datePaiement,
            modePaiement: modePaiement || null,
            statut: statut,
            notes: notes || null
        };
        
        console.log('Données à insérer:', nouveauPaiement);

        const [id] = await db("Paiements").insert(nouveauPaiement);
        nouveauPaiement.id = id;
        
        console.log('Paiement inséré avec ID:', id);
        
        // Vérifier ce qui a été réellement inséré
        const paiementInsere = await db("Paiements").where('id', id).first();
        console.log('Paiement vérifié dans la DB:', paiementInsere);
        
        // Vérifier si le prêt est complètement remboursé
        if (statut === 'Effectué' || statut === 'effectue') {
            // Récupérer le prêt
            const pret = await db("Prets").where('id', pret_id).first();
            
            if (pret) {
                // Calculer le total des paiements effectués pour ce prêt
                const totalPaiements = await db("Paiements")
                    .where('pret_id', pret_id)
                    .whereIn('statut', ['Effectué', 'effectue'])
                    .sum('montant as total')
                    .first();
                
                const montantRembourse = totalPaiements.total || 0;
                
                // Si le montant remboursé >= montant du prêt, marquer le prêt comme remboursé
                if (montantRembourse >= pret.montantPret) {
                    await db("Prets")
                        .where('id', pret_id)
                        .update({ statut: 'rembourse' });
                    console.log(`Prêt #${pret_id} marqué comme remboursé`);
                }
            }
        }
        
        res.status(201).json(nouveauPaiement);
    } catch (err) {
        console.error("Erreur /addPaiement", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

//-------------------------------------- suppression d'un paiement --------------------------------------//

app.delete('/deletePaiement/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Récupérer le paiement avant de le supprimer pour avoir le pret_id
        const paiement = await db("Paiements").where('id', id).first();
        
        if (!paiement) {
            return res.status(404).json({ error: "Paiement introuvable" });
        }
        
        const deleted = await db("Paiements").where('id', id).del();
        
        // Recalculer le statut du prêt après suppression
        const pret = await db("Prets").where('id', paiement.pret_id).first();
        
        if (pret) {
            // Calculer le total des paiements restants
            const totalPaiements = await db("Paiements")
                .where('pret_id', paiement.pret_id)
                .whereIn('statut', ['Effectué', 'effectue'])
                .sum('montant as total')
                .first();
            
            const montantRembourse = totalPaiements.total || 0;
            
            // Mettre à jour le statut du prêt
            if (montantRembourse >= pret.montantPret) {
                await db("Prets").where('id', paiement.pret_id).update({ statut: 'rembourse' });
            } else {
                // Si le prêt était remboursé mais ne l'est plus après suppression, le remettre en actif
                await db("Prets").where('id', paiement.pret_id).update({ statut: 'actif' });
            }
        }
        
        res.status(200).json({ message: "Paiement supprimé", deleted: deleted });
    } catch (err) {
        console.error("Erreur /deletePaiement/:id", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

//-------------------------------------- modification d'un paiement --------------------------------------//

app.put('/updatePaiement/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { montant, datePaiement, statut, notes } = req.body;

        // Récupérer le paiement actuel pour avoir le pret_id
        const paiementActuel = await db("Paiements").where('id', id).first();
        
        if (!paiementActuel) {
            return res.status(404).json({ error: "Paiement introuvable" });
        }

        const updatedPaiement = {
            montant: montant,
            datePaiement: datePaiement,
            statut: statut,
            notes: notes || null
        };

        const updated = await db("Paiements").where('id', id).update(updatedPaiement);
        
        // Recalculer le statut du prêt
        const pret = await db("Prets").where('id', paiementActuel.pret_id).first();
        
        if (pret) {
            const totalPaiements = await db("Paiements")
                .where('pret_id', paiementActuel.pret_id)
                .whereIn('statut', ['Effectué', 'effectue'])
                .sum('montant as total')
                .first();
            
            const montantRembourse = totalPaiements.total || 0;
            
            if (montantRembourse >= pret.montantPret) {
                await db("Prets").where('id', paiementActuel.pret_id).update({ statut: 'rembourse' });
            } else {
                await db("Prets").where('id', paiementActuel.pret_id).update({ statut: 'actif' });
            }
        }
        
        res.status(200).json({ message: "Paiement modifié", updated: updated });
    } catch (err) {
        console.error("Erreur /updatePaiement/:id", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

// Connexion administration
app.get('/admin', (req, res) =>{
    res.sendFile(path.join(__dirname, "../Client", "PageConnexion.html"));
});

app.post('/login', async (req, res) => {
    try {
        const { email, motDePasse } = req.body;
        if (!email || !motDePasse) {
            return res.status(400).json({ error: "Champs 'email' et 'motDePasse' obligatoires" });
        }
        const admin = await db("Administrateurs").where({ email: email }).first();
        if (!admin || admin.motDePasse !== motDePasse) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect" });
        }
        res.status(200).json({ message: "Connexion réussie" });
    } catch (err) {
        console.error("Erreur /login", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

app.post('/register', async (req, res) => {
    try {
        const { nom, email, motDePasse } = req.body;
        if (!nom || !email || !motDePasse) {
            return res.status(400).json({ error: "Champs 'nom', 'email' et 'motDePasse' obligatoires" });
        }
        const existingAdmin = await db("Administrateurs").where({ email: email }).first();
        if (existingAdmin) {
            return res.status(409).json({ error: "Un administrateur avec cet email existe déjà" });
        }
        const newAdmin = {
            nom: nom,
            email: email,
            motDePasse: motDePasse
        };
        const [id] = await db("Administrateurs").insert(newAdmin);
        newAdmin.id = id;
        res.status(201).json(newAdmin);
    } catch (err) {
        console.error("Erreur /register", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

//==================================== INITIALISATION DU SERVEUR ====================================//

createTable(), createTablePrets(), createTablePaiements() // appelle les fonctions de création des tables
.then(()=>{ // si tout se passe bien, démarre le serveur

   app.listen(3000, ()=>{ // écoute sur le port 3000
    console.log(`Express server listening at http://localhost:${port}`) // message de confirmation
});

})
.catch((err)=>{
   console.error("Erreur au demarrage du schema", err);
   process.exit(1);
})






