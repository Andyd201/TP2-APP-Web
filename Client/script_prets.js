//==============================================    CHARGER LA LISTE DES CLIENTS (SELECT ) ==============================================//

// Fonction pour charger la liste des clients dans le select
async function chargerClients() {
    try {
        const response = await fetch('http://localhost:3000/allClients'); // fetch pour obtenir les clients depuis le serveur
        
        // si la reponse n'est pas ok, on lance une erreur
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des clients');
        }

        const clients = await response.json(); // conversion de la reponse en JSON
        const selectClient = document.getElementById('nomClient'); // vient chercher le select dans le DOM (formulaire)
        
        // Vider le select (garder juste l'option par défaut)
        selectClient.innerHTML = '<option value="">Sélectionner un client</option>'; // sert à réinitialiser le select pour éviter les doublons
        
        // Ajouter chaque client au select
        clients.forEach(client => { // pour chaque client, on crée une option dans le select
            const option = document.createElement('option'); // création de l'élément option
            option.value = client.id; // valeur de l'option (id du client)
            option.textContent = `${client.prenom} ${client.nom}`; // texte affiché dans l'option (nom et prénom du client)
            selectClient.appendChild(option); // ajout de l'option au select
        });
    // attrape les erreurs
    } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
        alert('Erreur lors du chargement de la liste des clients');
    }
}

// Charger les clients au chargement de la page
chargerClients();

//============================================== AJOUT D'UN NOUVEAU PRÊT ==============================================//

// Fonction pour ajouter un nouveau prêt
async function ajouterPret(event) {
    event.preventDefault(); // Empêche le rechargement de la page
    
    // Récupération des valeurs du formulaire
    const client_id = parseInt(document.getElementById('nomClient').value); // ID du client sélectionné
    const montantPret = parseFloat(document.getElementById('montantPret').value); // Montant du prêt
    const dureeMois = parseInt(document.getElementById('dureeMois').value); // Durée en mois
    const tauxInteret = parseFloat(document.getElementById('tauxInteret').value); // Taux d'intérêt

    // Création d'un objet prêt
    const nouveauPret = {
        client_id: client_id,
        montantPret: montantPret,
        dureeMois: dureeMois,
        tauxInteret: tauxInteret
    };

    // try-catch pour la gestion des erreurs
    try {
        // Envoi de la requête POST vers le serveur
        const response = await fetch('http://localhost:3000/addPrets', { // fetch pour envoyer les données au serveur
            method: 'POST', // méthode POST pour ajouter des données
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nouveauPret) // conversion de l'objet prêt en JSON pour l'envoi
        });

        // si la reponse n'est pas ok, on lance une erreur
        if (!response.ok) {
            throw new Error('Erreur lors de l\'ajout du prêt');
        }

        const pretAjoute = await response.json(); // conversion de la reponse en JSON
        console.log('Prêt ajouté:', pretAjoute); 

        // Réinitialisation du formulaire
        document.getElementById('formPret').reset();
        
        // Actualisation de l'affichage des prêts
        afficherPrets(); // défini dans la section affichage des prêts
        
        alert('Prêt ajouté avec succès !');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'ajout du prêt: ' + error.message);
    }
}
// Ajout de l'événement de soumission du formulaire
document.getElementById('formPret').addEventListener('submit', ajouterPret); 

//============================================== AFFICHAGE DES PRÊTS ==============================================//

// Fonction pour afficher les prêts
async function afficherPrets() {
    const listePretsContainer = document.getElementById('listePrets'); // conteneur où les prêts seront affichés
    listePretsContainer.innerHTML = ''; // Réinitialisation du conteneur

    //
    try {
        // Récupération des prêts depuis le serveur
        const response = await fetch('http://localhost:3000/allPrets');
        
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des prêts');
        }

        const prets = await response.json();

        // Parcours des prêts et création des éléments HTML
        prets.forEach(pret => {
            const pretElement = document.createElement('div');
            pretElement.className = 'pret-item box';
            pretElement.innerHTML = `
                <h3 class="title is-4">Client ID: ${pret.client_id}</h3>
                <p><strong>Montant du prêt :</strong> €${pret.montantPret.toFixed(2)}</p>
                <p><strong>Durée :</strong> ${pret.dureeMois} mois</p>
                <p><strong>Taux d'intérêt :</strong> ${pret.tauxInteret}%</p>
                <button class="button is-danger is-small" onclick="supprimerPret(${pret.id})">Supprimer</button>
            `;
            listePretsContainer.appendChild(pretElement);
        });
    } catch (error) {
        console.error('Erreur:', error);
        listePretsContainer.innerHTML = '<p class="has-text-danger">Erreur lors du chargement des prêts</p>';
    }
}
// Appel initial pour afficher les prêts au chargement de la page
afficherPrets();
//============================================== RECHERCHE DE PRÊTS ==============================================//
// Fonction pour filtrer les prêts en fonction de la recherche
function filtrerPrets() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const pretItems = document.querySelectorAll('.pret-item');
    pretItems.forEach(item => {
        const nomClient = item.querySelector('h3').textContent.toLowerCase();
        if (nomClient.includes(searchInput)) {
            item.style.display = ''; // Afficher l'élément
        } else {
            item.style.display = 'none'; // Masquer l'élément
        }
    });
}
// Ajout de l'événement d'entrée pour la recherche
document.getElementById('searchInput').addEventListener('input', filtrerPrets);

//============================================== SUPPRESSION D'UN PRÊT ==============================================//
// Fonction pour supprimer un prêt
async function supprimerPret(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prêt ?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/deletePret/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression du prêt');
        }

        alert('Prêt supprimé avec succès !');
        afficherPrets(); // Rafraîchir l'affichage
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression du prêt: ' + error.message);
    }
}

