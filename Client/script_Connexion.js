
const API_URL = 'http://localhost:3000';


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
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, motDePasse: password })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Connexion reussie !');
            // Rediriger vers l'index de l'application
            // changez le chemin ci-dessous si vous voulez un autre fichier
            window.location.href = '/index.html';
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