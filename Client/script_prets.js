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
        selectClient.innerHTML = '<option value="">-- Sélectionner un client --</option>'; // sert à réinitialiser le select pour éviter les doublons
        
        // Ajouter chaque client au select
        clients.forEach(client => { // pour chaque client, on crée une option dans le select
            const option = document.createElement('option'); // création de l'élément option
            option.value = client.id; // valeur de l'option (id du client)
            option.textContent = `${client.Prenom} ${client.nom}`; // texte affiché dans l'option (nom et prénom du client)
            selectClient.appendChild(option); // ajout de l'option au select
        });
    // attrape les erreurs
    } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
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
    const dateDebut = document.getElementById('dateDebut').value; // Date de début

    // Création d'un objet prêt
    const nouveauPret = {
        client_id: client_id,
        montantPret: montantPret,
        dureeMois: dureeMois,
        tauxInteret: tauxInteret,
        dateDebut: dateDebut
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
    } catch (error) {
        console.error('Erreur:', error);
    }
}
// Ajout de l'événement de soumission du formulaire
document.getElementById('formPret').addEventListener('submit', ajouterPret); 

//============================================== AFFICHAGE DES PRÊTS ==============================================//

// Variables de pagination
let currentPage = 1;
const pretsPerPage = 10; // Nombre de prêts par page
let allPrets = []; // Stockage de tous les prêts

// Fonction pour afficher les prêts
async function afficherPrets() {
    const pretsTableBody = document.getElementById('pretsTableBody'); // corps du tableau des prêts
    pretsTableBody.innerHTML = ''; // Réinitialisation du corps du tableau

    try {
        // Récupération des prêts depuis le serveur
        const response = await fetch('http://localhost:3000/allPrets');
        
        // si la reponse n'est pas ok, on lance une erreur
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des prêts');
        }

        // si la reponse est ok, on convertit en JSON
        allPrets = await response.json();
        
        // Afficher les prêts de la page actuelle
        afficherPretsPagination();
        
    // vient attraper les erreurs
    } catch (error) {
        console.error('Erreur:', error);
        const row = document.createElement('tr'); // création d'une nouvelle ligne
        row.innerHTML = '<td colspan="7" style="text-align: center; color: red;">Erreur lors du chargement des prêts</td>';
        pretsTableBody.appendChild(row); // ajout de la ligne au corps du tableau
    }
}

// Fonction pour afficher les prêts de la page actuelle
async function afficherPretsPagination() {
    const pretsTableBody = document.getElementById('pretsTableBody'); // vient chercher le corps du tableau des prêts
    pretsTableBody.innerHTML = ''; // Réinitialisation du corps du tableau
    
    // Calculer les indices de début et de fin
    const startIndex = (currentPage - 1) * pretsPerPage; // indice de début
    const endIndex = startIndex + pretsPerPage; // indice de fin
    const pretsToDisplay = allPrets.slice(startIndex, endIndex); // prêts à afficher sur la page actuelle
    
    // Parcours des prêts et création des lignes du tableau
    for (const pret of pretsToDisplay) {
        const row = document.createElement('tr');
        
        // Formater la date de début
        const dateDebut = pret.dateDebut ? formatDate(pret.dateDebut) : 'N/A';
        
        // Calculer les intérêts cumulés
        const interetsCumules = calculerInteretsCumules(pret.montantPret, pret.tauxInteret, pret.dureeMois);
        
        // Calculer le solde restant
        const soldeRestant = await calculerSoldeRestant(pret.id, pret.montantPret, interetsCumules);
        
        // Déterminer le statut
        const statut = pret.statut || 'actif'; // statut du prêt, par défaut 'actif'
        const statutClasse = statut === 'actif' ? 'is-success' : // vert pour actif
                             statut === 'rembourse' ? 'is-info' : 'is-warning'; // bleu pour remboursé, orange pour en retard
        const statutTexte = statut === 'actif' ? 'Actif' : // texte à afficher
                           statut === 'rembourse' ? 'Remboursé' : 'En retard'; // texte à afficher 
        
        // Remplir la ligne du tableau avec les informations du prêt
        row.innerHTML = `
            <td>${pret.Prenom} ${pret.nom}</td>
            <td>$${pret.montantPret.toFixed(2)}</td> <!-- vient formater le montant du prêt -->
            <td>${pret.tauxInteret}%</td>
            <td>${pret.dureeMois} mois</td>
            <td>${dateDebut}</td>
            <td style="color: #f56565; font-weight: 600;">$${interetsCumules.toFixed(2)}</td> <!-- vient formater les intérêts cumulés -->
            <td style="color: ${soldeRestant > 0 ? '#f56565' : '#48bb78'}; font-weight: 600;">$${soldeRestant.toFixed(2)}</td> <!-- vient formater le solde restant -->
            <td><span class="tag ${statutClasse}">${statutTexte}</span></td>
            <td>
                <button class="button is-small is-warning" style="border-radius: 0.4em; font-weight: 700; font-size: 0.7em; margin-right: 0.5em;" onclick="toggleEditMode(${pret.id}, this)">✏️</button>
                <button class="button is-small is-danger" style="border-radius: 0.4em; font-weight: 700; font-size: 0.7em" onclick="supprimerPret(${pret.id})">Supprimer</button>
            </td>
        `;
        
        // Stocker les données originales dans la ligne pour l'édition
        row.dataset.pretId = pret.id; // identifiant du prêt
        row.dataset.clientId = pret.client_id; // identifiant du client
        row.dataset.montant = pret.montantPret; // montant du prêt
        row.dataset.taux = pret.tauxInteret; // taux d'intérêt
        row.dataset.duree = pret.dureeMois; // durée en mois
        row.dataset.date = pret.dateDebut; // date de début
        row.dataset.statut = statut; // statut du prêt
        
        // Ajouter la ligne au corps du tableau
        pretsTableBody.appendChild(row);
    }
    
    // Si aucun prêt, afficher un message
    if (allPrets.length === 0) {
        const row = document.createElement('tr'); // création d'une nouvelle ligne
        row.innerHTML = '<td colspan="7" style="text-align: center; padding: 20px;">Aucun prêt enregistré</td>';
        pretsTableBody.appendChild(row); // ajout de la ligne au corps du tableau
    }
    
    // Mettre à jour les boutons de pagination
    updatePaginationButtons();
}

// Fonction pour mettre à jour les boutons de pagination
function updatePaginationButtons() {
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const totalPages = Math.ceil(allPrets.length / pretsPerPage);
    
    // Désactiver/activer le bouton précédent
    if (currentPage === 1) { // première page
        prevButton.classList.add('is-disabled'); // désactiver le bouton précédent
        prevButton.style.pointerEvents = 'none'; // empêcher les clics
        prevButton.style.opacity = '0.5'; // réduire l'opacité
    } else {
        prevButton.classList.remove('is-disabled'); // activer le bouton précédent
        prevButton.style.pointerEvents = 'auto'; // permettre les clics
        prevButton.style.opacity = '1'; // rétablir l'opacité
    }
    
    // Désactiver/activer le bouton suivant
    if (currentPage >= totalPages || allPrets.length === 0) { // dernière page ou aucun prêt
        nextButton.classList.add('is-disabled'); // désactiver le bouton suivant
        nextButton.style.pointerEvents = 'none'; // empêcher les clics
        nextButton.style.opacity = '0.5'; // réduire l'opacité
    } else {
        nextButton.classList.remove('is-disabled'); // activer le bouton suivant
        nextButton.style.pointerEvents = 'auto'; // permettre les clics
        nextButton.style.opacity = '1'; // rétablir l'opacité
    }
    
    // Afficher les numéros de page
    const paginationList = document.getElementById('paginationList'); // liste des numéros de page
    paginationList.innerHTML = ''; // réinitialisation de la liste
    
    for (let i = 1; i <= totalPages; i++) { // pour chaque page
        const pageItem = document.createElement('li'); // création d'un élément de liste
        const pageLink = document.createElement('a'); // création d'un lien de page
        pageLink.classList.add('pagination-link'); // ajout de la classe pagination-link
        pageLink.textContent = i; // texte du lien (numéro de page)
        
        if (i === currentPage) { // page actuelle
            pageLink.classList.add('is-current'); // ajout de la classe is-current
            pageLink.style.backgroundColor = 'rgb(147, 112, 219)'; // couleur de fond pour la page actuelle
            pageLink.style.borderColor = 'rgb(147, 112, 219)'; // couleur de bordure pour la page actuelle
            pageLink.style.color = 'white'; // couleur du texte pour la page actuelle
        }
        
        pageLink.addEventListener('click', () => { // événement de clic sur le lien de page
            currentPage = i; // mise à jour de la page actuelle
            afficherPretsPagination();  // affichage des prêts pour la page sélectionnée
        });
        
        pageItem.appendChild(pageLink); // ajout du lien à l'élément de liste
        paginationList.appendChild(pageItem); // ajout de l'élément de liste à la liste de pagination
    }
}

// Événements pour les boutons de pagination
document.getElementById('prevPage').addEventListener('click', () => { // événement de clic sur le bouton précédent
    if (currentPage > 1) { // si la page actuelle est supérieure à 1
        currentPage--; // décrémenter la page actuelle
        afficherPretsPagination(); // afficher les prêts pour la page précédente
    }
});

document.getElementById('nextPage').addEventListener('click', () => { // événement de clic sur le bouton suivant
    const totalPages = Math.ceil(allPrets.length / pretsPerPage); // calcul du nombre total de pages
    if (currentPage < totalPages) { // si la page actuelle est inférieure au nombre total de pages
        currentPage++; // incrémenter la page actuelle
        afficherPretsPagination(); // afficher les prêts pour la page suivante
    }
});

// Appel initial pour afficher les prêts au chargement de la page
afficherPrets();
//============================================== RECHERCHE DE PRÊTS ==============================================//
// Fonction pour filtrer les prêts en fonction de la recherche
function filtrerPrets() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase(); // valeur de l'input de recherche en minuscules
    
    if (searchInput === '') {
        // Si la recherche est vide, afficher tous les prêts
        afficherPrets();
    } else {
        // Filtrer les prêts
        const pretsFiltres = allPrets.filter(pret => {
            const nomComplet = `${pret.Prenom} ${pret.nom}`.toLowerCase();
            return nomComplet.includes(searchInput);
        });
        
        // Remplacer temporairement allPrets par les prêts filtrés
        const tempPrets = allPrets;
        allPrets = pretsFiltres;
        currentPage = 1;
        afficherPretsPagination();
        allPrets = tempPrets;
    }
}
// Ajout de l'événement d'entrée pour la recherche
document.getElementById('searchInput').addEventListener('input', filtrerPrets);

//============================================== SUPPRESSION D'UN PRÊT ==============================================//
// Fonction pour supprimer un prêt
async function supprimerPret(id) {
    try {
        const response = await fetch(`http://localhost:3000/deletePret/${id}`, { // envoie une requête DELETE au serveur
            method: 'DELETE'
        });

        // si la reponse n'est pas ok, on lance une erreur
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression du prêt');
        }

        // Rafraîchir l'affichage après suppression
        console.log('Prêt supprimé avec succès');
        afficherPrets(); // Rafraîchir l'affichage
    // vient attraper les erreurs
    } catch (error) {
        console.error('Erreur:', error);
    }
}

//============================================== FONCTION UTILITAIRE POUR FORMATER LES DATES ==============================================//

// Fonction pour formater les dates au format JJ/MM/AAAA
function formatDate(dateString) {
    if (!dateString) return 'N/A'; // retourner N/A si la date est nulle ou indéfinie
    const date = new Date(dateString); // créer un objet Date à partir de la chaîne de date
    const jour = String(date.getDate()).padStart(2, '0'); // jour avec deux chiffres
    const mois = String(date.getMonth() + 1).padStart(2, '0'); // mois avec deux chiffres
    const annee = date.getFullYear(); // année sur quatre chiffres
    return `${jour}/${mois}/${annee}`; // retourner la date formatée
}

// Fonction pour convertir une date formatée JJ/MM/AAAA en format YYYY-MM-DD
function dateToInputFormat(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');
    return `${annee}-${mois}-${jour}`;
}

//============================================== CALCULS FINANCIERS ==============================================//

// Fonction pour calculer les intérêts cumulés
function calculerInteretsCumules(montantPret, tauxAnnuel, dureeMois) {
    // Intérêts simples: Montant × Taux × Durée
    const tauxDecimal = tauxAnnuel / 100;
    const dureeAnnees = dureeMois / 12;
    const interets = montantPret * tauxDecimal * dureeAnnees;
    return interets;
}

// Fonction pour calculer le solde restant
async function calculerSoldeRestant(pretId, montantPret, interetsCumules) {
    try {
        // Récupérer tous les paiements pour ce prêt
        const response = await fetch('http://localhost:3000/allPaiements');
        const paiements = await response.json();
        
        // Filtrer les paiements pour ce prêt spécifique
        const paiementsPret = paiements.filter(p => p.pret_id === pretId);
        
        // Calculer le total des paiements
        const totalPaye = paiementsPret.reduce((sum, p) => sum + parseFloat(p.montant || 0), 0);
        
        // Montant total à rembourser = montant du prêt + intérêts
        const montantTotal = montantPret + interetsCumules;
        
        // Solde restant = montant total - total payé
        const soldeRestant = montantTotal - totalPaye;
        
        return Math.max(0, soldeRestant); // Ne pas retourner de valeur négative
    } catch (error) {
        console.error('Erreur lors du calcul du solde restant:', error);
        return montantPret + interetsCumules; // En cas d'erreur, retourner le montant total
    }
}

//============================================== MODIFICATION D'UN PRÊT (INLINE) ==============================================//

// Variable pour suivre la ligne en cours d'édition
let ligneEnEdition = null;

// Fonction pour activer/désactiver le mode édition
async function toggleEditMode(pretId, button) { // le bouton d'édition est passé en paramètre
    const row = button.closest('tr'); // vient chercher la ligne parente du bouton cliqué
    
    // Si une autre ligne est en édition, on l'annule d'abord
    if (ligneEnEdition && ligneEnEdition !== row) {
        // Annuler l'édition précédente
        await afficherPrets(); // Rafraîchir l'affichage pour annuler les modifications
    }
    
    // Si on clique à nouveau sur la même ligne, on sauvegarde les modifications
    if (ligneEnEdition === row) {
        // Sauvegarder les modifications
        await sauvegarderModificationInline(row); // fonction pour sauvegarder les modifications inline
        ligneEnEdition = null; // réinitialiser la ligne en édition
        button.textContent = '✏️'; // remettre l'icône du crayon
        button.classList.remove('is-success'); // retirer la classe de succès
        button.classList.add('is-warning'); // ajouter la classe d'avertissement
    } else {
        // Activer le mode édition
        ligneEnEdition = row; // définir la ligne en édition
        button.textContent = '✓'; // changer l'icône en coche
        button.classList.remove('is-warning'); // retirer la classe d'avertissement
        button.classList.add('is-success'); // ajouter la classe de succès
        
        // Charger les clients pour le select
        const responseClients = await fetch('http://localhost:3000/allClients'); // fetch pour obtenir les clients depuis le serveur
        const clients = await responseClients.json(); // conversion de la reponse en JSON
        
        // Remplacer les cellules par des champs éditables
        const cells = row.cells;
        
        // Client (select)
        let clientSelect = '<select class="input" style="padding: 0.25em;">'; // création du select
        clients.forEach(client => { // pour chaque client
            const selected = client.id == row.dataset.clientId ? 'selected' : ''; // vérifier si c'est le client sélectionné
            clientSelect += `<option value="${client.id}" ${selected}>${client.Prenom} ${client.nom}</option>`; // ajouter l'option au select
        });
        clientSelect += '</select>'; // fermeture du select
        cells[0].innerHTML = clientSelect; // insérer le select dans la cellule
        
        // Montant
        cells[1].innerHTML = `<input type="number" class="input" value="${row.dataset.montant}" step="0.01" style="width: 100px;">`;
        
        // Taux
        cells[2].innerHTML = `<input type="number" class="input" value="${row.dataset.taux}" step="0.01" style="width: 80px;">`;
        
        // Durée
        cells[3].innerHTML = `<input type="number" class="input" value="${row.dataset.duree}" style="width: 80px;">`;
        
        // Date
        cells[4].innerHTML = `<input type="date" class="input" value="${dateToInputFormat(row.dataset.date)}" style="width: 150px;">`;
        
        // Statut (select)
        const statutValue = row.dataset.statut; // obtenir le statut actuel
        // vient créer le select pour le statut
        cells[7].innerHTML = `
            <select class="input" style="padding: 0.25em;">
                <option value="actif" ${statutValue === 'actif' ? 'selected' : ''}>Actif</option>
                <option value="rembourse" ${statutValue === 'rembourse' ? 'selected' : ''}>Remboursé</option>
                <option value="en_retard" ${statutValue === 'en_retard' ? 'selected' : ''}>En retard</option>
            </select>
        `;
    }
}

// Fonction pour sauvegarder la modification inline
async function sauvegarderModificationInline(row) {
    const cells = row.cells; // obtenir les cellules de la ligne
    const pretId = row.dataset.pretId; // obtenir l'ID du prêt
    
    // Créer un objet avec les nouvelles valeurs du prêt
    const pretModifie = {
        client_id: parseInt(cells[0].querySelector('select').value),
        montantPret: parseFloat(cells[1].querySelector('input').value),
        tauxInteret: parseFloat(cells[2].querySelector('input').value),
        dureeMois: parseInt(cells[3].querySelector('input').value),
        dateDebut: cells[4].querySelector('input').value,
        statut: cells[7].querySelector('select').value
    };
    
    // Envoyer la requête PUT pour mettre à jour le prêt
    try {
        const response = await fetch(`http://localhost:3000/updatePret/${pretId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pretModifie) // conversion de l'objet prêt modifié en JSON pour l'envoi
        });
        
        // si la reponse n'est pas ok, on lance une erreur
        if (!response.ok) {
            throw new Error('Erreur lors de la modification du prêt');
        }

        
        console.log('Prêt modifié avec succès');
        await afficherPrets(); // Rafraîchir l'affichage
    // si une erreur survient
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la modification du prêt');
    }
}

