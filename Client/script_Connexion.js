
const API_URL = 'http://localhost:3000';

// Vérifier si l'utilisateur est déjà connecté (avec "Se souvenir de moi")
window.addEventListener('DOMContentLoaded', () => { // attendre que le DOM soit chargé
    const rememberedUser = localStorage.getItem('rememberedUser'); // récupérer les données sauvegardées
    if (rememberedUser) { // si des données existent
        const userData = JSON.parse(rememberedUser); // parse sert à convertir une chaîne JSON en objet JavaScript
        // Remplir automatiquement le formulaire
        const loginForm = document.getElementById('loginForm'); // obtenir le formulaire de connexion
        if (loginForm) { // si le formulaire existe
            loginForm.email.value = userData.email; // remplir le champ email
            loginForm.password.value = userData.password; // remplir le champ mot de passe
            document.getElementById('rememberMe').checked = true; // cocher la case "Se souvenir de moi"
        }
    }
});

function showLoginForm(formId) {
    document.querySelectorAll('.form-box').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(formId).classList.add('active');
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        const rememberMe = document.getElementById('rememberMe').checked; // vérifier si la case est cochée
        
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, motDePasse: password })
        });
        const data = await response.json();
        if (response.ok) {
            // Sauvegarder dans sessionStorage (toujours)
            sessionStorage.setItem('userLoggedIn', 'true');
            sessionStorage.setItem('userEmail', email);
            
            // Si "Se souvenir de moi" est coché, sauvegarder dans localStorage
            if (rememberMe) {
                localStorage.setItem('rememberedUser', JSON.stringify({
                    email: email,
                    password: password
                }));
            } else {
                // Supprimer les données sauvegardées si la case n'est pas cochée
                localStorage.removeItem('rememberedUser');
            }
            
            alert('Connexion réussie !');
            // Rediriger vers l'index de l'application
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Erreur de connexion');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion');
    }
    });
} else {
    console.warn('loginForm not found in DOM');
}
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nomUtilisateur = registerForm['nom-utilisateur'].value;
        const email = registerForm.email.value;
        const password = registerForm.password.value;
        try {
            const response = await fetch(`${API_URL}/createAdmin`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nom: nomUtilisateur, email, motDePasse: password })
            });
            const data = await response.json();
            if (response.ok) {
                alert('Inscription reussie ! Vous pouvez maintenant vous connecter.');
                showLoginForm('login-form');
            } else {
                alert(data.message || "Erreur d'inscription");
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert("Erreur d'inscription");
        }
    });
} else {
    console.warn('registerForm not found in DOM');
}