document.addEventListener('DOMContentLoaded', () => {
    const currentUserId = document.body.dataset.userId;
    const currentUserType = document.body.dataset.userType;

    // Favoritar ou desfavoritar vaga
    document.querySelectorAll('.btn-favoritar-vaga').forEach(button => {
        button.addEventListener('click', () => {
            const vagaId = button.getAttribute('data-id');
            const isFavoritada = button.classList.contains('favoritada');
            const rota = isFavoritada ? '/desfavoritar-vaga' : '/favoritar-vaga';

            fetch(rota, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id: currentUserId,
                    usuario_tipo: currentUserType,
                    vaga_id: vagaId
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    button.classList.toggle('favoritada');
                    button.innerHTML = `<i class="fa${button.classList.contains('favoritada') ? 's' : '-regular'} fa-heart"></i>`;
                }
            })
            .catch(err => {
                console.error('Erro ao (des)favoritar vaga:', err);
                alert('Erro ao processar o favorito.');
            });
        });
    });

    // Buscar favoritos salvos
    fetch(`/favoritos-vagas/${currentUserType}/${currentUserId}`)
        .then(res => res.json())
        .then(favoritos => {
            document.querySelectorAll('.btn-favoritar-vaga').forEach(button => {
                const vagaId = parseInt(button.getAttribute('data-id'));
                if (favoritos.includes(vagaId)) {
                    button.classList.add('favoritada');
                    button.innerHTML = `<i class="fas fa-heart"></i>`;
                }
            });
        })
        .catch(err => {
            console.error('Erro ao carregar favoritos:', err);
        });
});
