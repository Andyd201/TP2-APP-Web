// Script de déconnexion

document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Demander confirmation (optionnel)
            const confirmer = confirm('Voulez-vous vraiment vous déconnecter ?');
            
            if (confirmer) {
                // Supprimer les données de session
                sessionStorage.clear();
                
                // Garder les données "Se souvenir de moi" (ne pas supprimer localStorage)
                // Si vous voulez aussi supprimer "Se souvenir de moi", décommentez la ligne suivante:
                // localStorage.removeItem('rememberedUser');
                
                // Rediriger vers la page de connexion
                window.location.href = 'PageConnexion.html';
            }
        });
    }
});
