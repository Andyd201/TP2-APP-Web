const express = require('express')
const path = require('path')
const port = 3000


const {db, createTable} = require('./DBclient')
const { stringify } = require('querystring')
const { error } = require('console')


const app = express()

app.use(express.json())

app.use(express.static(path.join(__dirname, '../Client')));

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, "../Client", "Clients.html"));

});

app.post('/addClients', async (req, res)=>{
    try{
        const {nom, prenom, telephone, email, addresse} = req.body;

        if(!nom, !prenom, !telephone, !email, !addresse){
            return res.status(400).json({error: "champ 'nom', 'prenom', 'telephone', 'email', !addresse obligation"})
        }

        const client = {
            nom: nom,
            prenom: prenom,
            telephone: telephone,
            email: email,
            addresse: addresse
        }
        await db("Clients").insert(client);
        res.status(201).json(product);
    }catch(err){
        console.error("Erreur /addClients", err);
      res.status(500).json({error: "Erreur serveur.." })
    }
});


createTable()
.then(()=>{

   app.listen(3000, ()=>{
    console.log(`serveur en cours d'execution sur http://localhost:${port}`)
});

})
.catch((err)=>{
   console.error("Erreur au demarrage du schema", err);
   process.exit(1);
})