const API = "http://localhost:3000";

const form = document.getElementById("formClient");
const table = document.getElementById("tableClients");
const search = document.getElementById("search");

// Ajouter un client
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const client = {
        nom: document.getElementById("nom").value,
        Prenom: document.getElementById("Prenom").value,
        Telephone: document.getElementById("Telephone").value,
        email: document.getElementById("email").value,
        adresse: document.getElementById("adresse").value
    };

    await fetch(`${API}/addClients`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(client)
    });

    form.reset();
    loadClients();
});

// Charger tous les clients
async function loadClients() {
    const res = await fetch(`${API}/allClients`);
    const clients = await res.json();
    displayClients(clients);
}

function displayClients(list) {
    table.innerHTML = "";

    list.forEach(c => {
        table.innerHTML += `
            <tr>
                <td>${c.Prenom}</td>
                <td>${c.nom}</td>
                <td>${c.Telephone}</td>
                <td>${c.email}</td>
                <td>${c.adresse}</td>
                <td>
                    <button class="button is-danger is-small" style="border-radius:0.4em; font-weight:700; font-size:0.7em" onclick="deleteClient(${c.id})">
                        Supprimer
                    </button>
                </td>
            </tr>
        `;
    });
}

async function deleteClient(id) {
    await fetch(`${API}/deleteClient/${id}`, { method: "DELETE" });
    loadClients();
}

// Recherche instantanée
search.addEventListener("input", async () => {
    const res = await fetch(`${API}/allClients`);
    const clients = await res.json();

    const value = search.value.toLowerCase();

    const filtered = clients.filter(c =>
        c.nom.toLowerCase().includes(value) ||
        c.Prenom.toLowerCase().includes(value) ||
        String(c.Telephone).includes(value)
    );

    displayClients(filtered);
});

loadClients();
