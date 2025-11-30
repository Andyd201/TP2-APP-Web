// Script pour rendre le dashboard dynamique en chargeant les données depuis l'API

const API_URL = 'http://localhost:3000';

//==================================================== CHARGEMENT DES STATISTIQUES ==============================================

// Fonction pour charger les statistiques du dashboard
async function chargerStatistiques() {
    try {
        const response = await fetch(`${API_URL}/statistiques`);
        const stats = await response.json();
        
        // Mise à jour des prêts actifs
        document.querySelector('.info-box-actif .info-box-number').textContent = stats.pretsActifs || 0;
        
        // Mise à jour des prêts remboursés
        document.querySelector('.info-box-rembourse .info-box-number').textContent = stats.pretsRembourses || 0;
        
        // Mise à jour des prêts en retard
        document.querySelector('.info-box-retard .info-box-number').textContent = stats.pretsEnRetard || 0;
        
        // Mise à jour de la pastille rouge
        document.querySelector('.pastille-nombre').textContent = stats.pretsEnRetard || 0;
        
        // Mise à jour du montant total prêté
        document.querySelector('.info-box-amount .info-box-number-large').textContent = 
            formatMontant(stats.montantTotalPrete);
        
        // Mise à jour du montant total remboursé
        document.querySelector('.info-box-repaid .info-box-number-large').textContent = 
            formatMontant(stats.montantTotalRembourse);
            
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

//==================================================== CHARGEMENT DES CLIENTS EN RETARD ==============================================

// Fonction pour charger la liste des clients en retard
async function chargerClientsEnRetard() {
    try {
        const response = await fetch(`${API_URL}/clientsEnRetard`); // récupération des clients en retard
        const clients = await response.json(); // conversion de la réponse en JSON
        
        const tbody = document.querySelector('.loans-table tbody'); // sélection du corps du tableau
        tbody.innerHTML = ''; // Vider le tableau
        
        // si aucun client en retard
        if (clients.length === 0) { 
            // on affiche un message indiquant qu'il n'y a aucun client en retard
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: white;">Aucun client en retard</td></tr>';
            return;
        }
        
        // sinon on affiche la liste des clients en retard
        clients.forEach(client => {
            const tr = document.createElement('tr'); // vient créer une nouvelle ligne dans le tableau
            
            // Déterminer le statut en fonction des jours de retard
            let statutClass = 'status-moderate'; // classe CSS pour le statut modéré
            let statutTexte = 'Modéré'; // texte pour le statut modéré
            if (client.joursRetard > 30) { // si le retard est supérieur à 30 jours
                statutClass = 'status-critical'; // classe CSS pour le statut critique
                statutTexte = 'Critique'; // texte pour le statut critique
            } else if (client.joursRetard > 15) { // si le retard est supérieur à 15 jours
                statutClass = 'status-warning'; // classe CSS pour le statut attention
                statutTexte = 'Attention'; // texte pour le statut attention
            }
            
            // Créer les initiales pour l'avatar
            const initiales = obtenirInitiales(client.Prenom, client.nom);
            
            // Remplir la ligne du tableau avec les informations du client
            tr.innerHTML = `
                <td>
                    <div class="client-info">
                        <div class="client-avatar">${initiales}</div>
                        <div class="client-details">
                            <a href="Clients.html" style="text-decoration: none; color: inherit;"> <!-- Lien vers la page Clients -->
                                <span class="client-name">${client.Prenom} ${client.nom}</span>
                            </a>
                            <span class="client-phone">${client.Telephone || 'N/A'}</span>
                        </div>
                    </div>
                </td>
                <td class="amount">${formatMontant(client.montantDu)}</td> <!-- formatMontant pour formater le montant -->
                <td class="date">${formatDate(client.dateEcheance)}</td> <!-- formatDate pour formater la date -->
                <td>
                    <span class="nb-jours">${client.joursRetard} jours</span>
                </td>
                <td><span class="status-badge ${statutClass}">${statutTexte}</span></td> <!-- badge de statut pour indiquer le niveau de retard -->
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-call" title="Appeler" onclick="appelerClient('${client.Telephone}')">
                            <i class="fa-solid fa-phone"></i>
                        </button>
                        <button class="btn-icon btn-email" title="Envoyer un email" onclick="envoyerEmail('${client.email}')"> <!-- bouton pour envoyer un email qui fait appel à la fonction envoyerEmail -->
                            <i class="fa-solid fa-envelope"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(tr); // ajouter la ligne au corps du tableau
        });
        
    // vient attraper les erreurs lors du chargement des clients en retard
    } catch (error) {
        console.error('Erreur lors du chargement des clients en retard:', error);
    }
}

//==================================================== FONCTIONS UTILITAIRES ==============================================

// Fonction pour formater les montants (ajouter $ et espaces)
function formatMontant(montant) {
    if (!montant) return '0 $'; // retourner 0 $ si le montant est nul ou indéfini
    return new Intl.NumberFormat('fr-CA', { // format pour le Canada français
        style: 'currency', // style de formatage en devise
        currency: 'CAD', // devise canadienne
        minimumFractionDigits: 0, // nombre minimum de chiffres après la virgule
        maximumFractionDigits: 0 // nombre maximum de chiffres après la virgule
    }).format(montant).replace('CA', '').trim(); // retirer le code pays CA et enlever les espaces
}

// Fonction pour formater les dates
function formatDate(dateString) {
    if (!dateString) return 'N/A'; // retourner N/A si la date est nulle ou indéfinie
    const date = new Date(dateString); // créer un objet Date à partir de la chaîne de date
    const jour = String(date.getDate()).padStart(2, '0'); // jour avec deux chiffres
    const mois = String(date.getMonth() + 1).padStart(2, '0'); // mois avec deux chiffres
    const annee = date.getFullYear(); // année sur quatre chiffres
    return `${jour}/${mois}/${annee}`; // format JJ/MM/AAAA
}

// Fonction pour obtenir les initiales d'un nom
function obtenirInitiales(prenom, nom) {
    const initialePrenom = prenom ? prenom.charAt(0).toUpperCase() : ''; // première lettre du prénom en majuscule
    const initialeNom = nom ? nom.charAt(0).toUpperCase() : ''; // première lettre du nom en majuscule
    return initialePrenom + initialeNom; // concaténer les initiales
}

// Fonction pour appeler un client (simulée)
function appelerClient(telephone) {
    alert(`Appel vers ${telephone}`); // afficher une alerte avec le numéro de téléphone
    // Dans une vraie application, cela pourrait ouvrir l'application téléphone
    // window.location.href = `tel:${telephone}`;
}

// Fonction pour envoyer un email (simulée)
function envoyerEmail(email) {
    if (email && email !== 'N/A') { // vérifier que l'email est défini et différent de 'N/A'
        window.location.href = `mailto:${email}`; // ouvrir le client de messagerie avec l'adresse email
    } else {
        alert('Adresse email non disponible'); // afficher une alerte si l'email n'est pas disponible
    }
}

//==================================================== BOUTON PASTILLE ROUGE ==============================================

const boutonPastilleRouge = document.querySelector(".pastille-rouge"); // sélection du bouton de la pastille rouge
boutonPastilleRouge.onclick = () => { // ajout d'un événement onclick
    location.reload(); // rechargement de la page pour actualiser les données
};

//==================================================== INITIALISATION ==============================================

// Charger toutes les données au chargement de la page
document.addEventListener('DOMContentLoaded', () => { // événement déclenché lorsque le contenu du DOM est chargé
    chargerStatistiques(); // charger les statistiques
    chargerClientsEnRetard(); // charger les clients en retard
});