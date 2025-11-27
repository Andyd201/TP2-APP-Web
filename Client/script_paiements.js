// ====== Variables globales ======
let allPaiements = [];
let allPrets = [];
let allClients = [];

// ====== Initialisation ======
document.addEventListener('DOMContentLoaded', () => {
    loadPrets();
    loadPaiements();
    setupEventListeners();
});

// ====== Charger les prêts ======
async function loadPrets() {
    try {
        const response = await fetch('http://localhost:3000/allPrets');
        if (!response.ok) throw new Error('Erreur lors du chargement des prêts');
        allPrets = await response.json();
        loadClients();
        populatePretSelect();
    } catch (error) {
        console.error('Erreur loadPrets:', error);
    }
}

// ====== Charger les clients ======
async function loadClients() {
    try {
        const response = await fetch('http://localhost:3000/allClients');
        if (!response.ok) throw new Error('Erreur lors du chargement des clients');
        allClients = await response.json();
    } catch (error) {
        console.error('Erreur loadClients:', error);
    }
}

// ====== Charger les paiements ======
async function loadPaiements() {
    try {
        const response = await fetch('http://localhost:3000/allPaiements');
        if (!response.ok) throw new Error('Erreur lors du chargement des paiements');
        allPaiements = await response.json();
        displayPaiements(allPaiements);
        updateStats();
    } catch (error) {
        console.error('Erreur loadPaiements:', error);
    }
}

// ====== Remplir le sélect des prêts ======
function populatePretSelect() {
    const select = document.getElementById('pret_id');
    select.innerHTML = '<option value="">-- Sélectionner un prêt --</option>';
    
    allPrets.forEach(pret => {
        const client = allClients.find(c => c.id === pret.client_id);
        const clientName = client ? `${client.Prenom} ${client.nom}` : `Client ${pret.client_id}`;
        const option = document.createElement('option');
        option.value = pret.id;
        option.textContent = `Prêt #${pret.id} - ${clientName} (${pret.montantPret}$)`;
        select.appendChild(option);
    });
}

// ====== Afficher les paiements ======
function displayPaiements(paiements) {
    const tbody = document.getElementById('tablePaiements');
    tbody.innerHTML = '';

    if (paiements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2em;">Aucun paiement enregistré</td></tr>';
        return;
    }

    paiements.forEach(paiement => {
        const pret = allPrets.find(p => p.id === paiement.pret_id);
        const client = allClients.find(c => c.id === pret?.client_id);
        const clientName = client ? `${client.Prenom} ${client.nom}` : 'Inconnu';

        const statusClass = paiement.statut.toLowerCase().replace(/\s+/g, '');
        const statusBadge = `<span class="status-badge ${statusClass}">${paiement.statut}</span>`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${paiement.pret_id}</td>
            <td>${clientName}</td>
            <td>${paiement.montant.toFixed(2)}$</td>
            <td>${new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}</td>
            <td>${statusBadge}</td>
            <td>${paiement.notes || '-'}</td>
            <td><button class="delete-btn" onclick="deletePaiement(${paiement.id})">Supprimer</button></td>
        `;
        tbody.appendChild(row);
    });
}

// ====== Mettre à jour les statistiques ======
function updateStats() {
    const effectue = allPaiements.filter(p => p.statut === 'Effectué').length;
    const attente = allPaiements.filter(p => p.statut === 'En attente').length;
    const echec = allPaiements.filter(p => p.statut === 'Échoué').length;
    const total = allPaiements.reduce((sum, p) => sum + p.montant, 0);

    document.getElementById('countEffectue').textContent = effectue;
    document.getElementById('countAttente').textContent = attente;
    document.getElementById('countEchec').textContent = echec;
    document.getElementById('totalMontant').textContent = total.toFixed(2) + ' $';
}

// ====== Configurer les écouteurs d'événements ======
function setupEventListeners() {
    document.getElementById('formPaiement').addEventListener('submit', handleFormSubmit);
    document.getElementById('search').addEventListener('input', handleSearch);
    document.getElementById('filterStatut').addEventListener('change', handleFilterChange);
}

// ====== Soumettre le formulaire ======
async function handleFormSubmit(e) {
    e.preventDefault();

    const pret_id = document.getElementById('pret_id').value;
    const montant = parseFloat(document.getElementById('montant').value);
    const datePaiement = document.getElementById('datePaiement').value;
    const statut = document.getElementById('statut').value;
    const notes = document.getElementById('notes').value;

    if (!pret_id || !montant || !datePaiement || !statut) {
        console.error('Champs requis manquants');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/addPaiement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pret_id: parseInt(pret_id),
                montant,
                datePaiement,
                statut,
                notes
            })
        });

        if (!response.ok) throw new Error('Erreur lors de l\'ajout du paiement');

        console.log('Paiement enregistré avec succès');
        document.getElementById('formPaiement').reset();
        loadPaiements();
    } catch (error) {
        console.error('Erreur handleFormSubmit:', error);
    }
}

// ====== Rechercher ======
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allPaiements.filter(paiement => {
        const pret = allPrets.find(p => p.id === paiement.pret_id);
        const client = allClients.find(c => c.id === pret?.client_id);
        const clientName = client ? `${client.Prenom} ${client.nom}`.toLowerCase() : '';
        
        return (
            paiement.pret_id.toString().includes(searchTerm) ||
            clientName.includes(searchTerm) ||
            paiement.statut.toLowerCase().includes(searchTerm)
        );
    });
    displayPaiements(filtered);
}

// ====== Filtrer par statut ======
function handleFilterChange(e) {
    const statut = e.target.value;
    const filtered = statut 
        ? allPaiements.filter(p => p.statut === statut)
        : allPaiements;
    displayPaiements(filtered);
}

// ====== Supprimer un paiement ======
async function deletePaiement(id) {
    try {
        const response = await fetch(`http://localhost:3000/deletePaiement/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Erreur lors de la suppression');

        console.log('Paiement supprimé avec succès');
        loadPaiements();
    } catch (error) {
        console.error('Erreur deletePaiement:', error);
    }
}
