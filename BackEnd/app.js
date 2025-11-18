const express = require('express');
const path = require('path')
const port = 3000


const {db, createTable} = require('./DBclient')


const app = express()

app.use(express.json())

app.use(express.static(path.join(__dirname, '../Client')));

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, "../Client", "Clients.html"));

});

app.post('/addClients', async (req, res)=>{
    try{
        const {nom, prenom, telephone, email, adresse} = req.body;

        if(!nom || !prenom || !telephone || !email || !adresse){
            return res.status(400).json({error: "champ 'nom', 'prenom', 'telephone', 'email', 'adresse' obligation"})
        }

        const client = {
            nom: nom,
            prenom: prenom,
            telephone: telephone,
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




createTable()
.then(()=>{

   app.listen(3000, ()=>{
    console.log(`Express server listening at http://localhost:${port}`)
});

})
.catch((err)=>{
   console.error("Erreur au demarrage du schema", err);
   process.exit(1);
})



