const express = require('express');
const path = require('path')
const port = 3000


const {db, createTable} = require('./DBclient')
const {createTablePrets} = require('./DBprets')
const {createTablePaiements} = require('./DBpaiements')


const app = express()

app.use(express.json())

// Ajout des en-têtes CORS pour permettre les requêtes depuis le frontend
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

//========================================= ROUTES POUR LES PRÊTS =========================================//


app.get('/', (req, res) =>{ // Route pour servir la page des prêts
    res.sendFile(path.join(__dirname, "../Client", "prets.html")); // Envoie le fichier HTML des prêts
});

//-------------------------------------- récupération de tous les prêts --------------------------------------//

app.get('/allPrets', async (req, res) => { // Route pour récupérer tous les prêts
    try {
        const tousLesPrets = await db("Prets").select("*").orderBy("id", "desc");
        res.status(200).json(tousLesPrets );
    } catch (err) {
        console.error("Erreur /allPrets", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

//-------------------------------------- ajout d'un nouveau prêt --------------------------------------//

app.post('/addPrets', async (req, res) => { // Route pour ajouter un nouveau prêt
    try {
        const { client_id, montantPret, dureeMois, tauxInteret } = req.body; // req.body vient recueillir les données envoyées par le client
        if (!client_id || !montantPret || !dureeMois || !tauxInteret) { // si un des champs est manquant, envoie une erreur 400
            return res.status(400).json({ error: "Champs 'client_id', 'montantPret', 'dureeMois', 'tauxInteret' obligatoires" });
        }
        // Création de l'objet prêt
        const nouveauPret = {
            client_id: client_id,
            montantPret: montantPret,
            dureeMois: dureeMois,
            tauxInteret: tauxInteret
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

//========================================= ROUTES POUR LES PAIEMENTS =========================================//

//-------------------------------------- récupération de tous les paiements --------------------------------------//

app.get('/allPaiements', async (req, res) => {
    try {
        const tousPaiements = await db("Paiements").select("*").orderBy("id", "desc");
        res.status(200).json(tousPaiements);
    } catch (err) {
        console.error("Erreur /allPaiements", err);
        res.status(500).json({ error: "Erreur serveur.." });
    }
});

//-------------------------------------- ajout d'un nouveau paiement --------------------------------------//

app.post('/addPaiement', async (req, res) => {
    try {
        const { pret_id, montant, datePaiement, statut, notes } = req.body;

        if (!pret_id || !montant || !datePaiement || !statut) {
            return res.status(400).json({ error: "Champs 'pret_id', 'montant', 'datePaiement', 'statut' obligatoires" });
        }

        const nouveauPaiement = {
            pret_id: pret_id,
            montant: montant,
            datePaiement: datePaiement,
            statut: statut,
            notes: notes || null
        };

        const [id] = await db("Paiements").insert(nouveauPaiement);
        nouveauPaiement.id = id;
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
        const deleted = await db("Paiements").where('id', id).del();
        if (deleted == 0) {
            return res.status(404).json({ error: "Paiement introuvable" });
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

        const updatedPaiement = {
            montant: montant,
            datePaiement: datePaiement,
            statut: statut,
            notes: notes || null
        };

        const updated = await db("Paiements").where('id', id).update(updatedPaiement);
        if (updated == 0) {
            return res.status(404).json({ error: "Paiement introuvable" });
        }
        res.status(200).json({ message: "Paiement modifié", updated: updated });
    } catch (err) {
        console.error("Erreur /updatePaiement/:id", err);
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






