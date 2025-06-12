document.addEventListener('DOMContentLoaded', () => {
    const toggleAddPostBtn = document.getElementById('toggleAddPostBtn');
    const addPostWrapper = document.getElementById('addPostWrapper');
    const addPostForm = document.getElementById('addPostForm');
    const cancelPostBtn = document.getElementById('cancelPostBtn');
    const postList = document.getElementById('postList');
    const formMessage = document.getElementById('formMessage');

    const currentUserId = document.body.dataset.userId;
    const currentUserType = document.body.dataset.userType;

    if (toggleAddPostBtn) {
        toggleAddPostBtn.addEventListener('click', () => {
            addPostWrapper.classList.toggle('hidden');
            if (!addPostWrapper.classList.contains('hidden')) {
                toggleAddPostBtn.textContent = '➖Cancelar';
            } else {
                toggleAddPostBtn.textContent = '➕Nova Publicação';
            }
            formMessage.textContent = '';
            addPostForm.reset();
        });
    }

    if (cancelPostBtn) {
        cancelPostBtn.addEventListener('click', () => {
            addPostWrapper.classList.add('hidden');
            if (toggleAddPostBtn) {
                toggleAddPostBtn.textContent = '➕Nova Publicação';
            }
            formMessage.textContent = '';
            addPostForm.reset();
        });
    }

    if (addPostForm) {
        addPostForm.addEventListener('submit', (event) => {
            event.preventDefault();
            formMessage.textContent = '';

            const formData = new FormData(addPostForm);
            const postData = {};
            formData.forEach((value, key) => {
                postData[key] = value;
            });

            postData.userId = currentUserId;
            postData.userType = currentUserType;
            postData.data_publicacao = new Date().toISOString();

            console.log('Dados enviados para /add-post:', postData);

            fetch('/add-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    location.reload();
                } else {
                    alert('Erro ao Publicar: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erro na requisição fetch:', error);
                alert('Ocorreu um erro de comunicação com o servidor: ' + error.message);
            });
        });
    }

    // Lógica de favoritar/desfavoritar publicação
    document.querySelectorAll('.btn-favoritar').forEach(button => {
        button.addEventListener('click', () => {
            const postId = button.getAttribute('data-id');
            const isFavoritado = button.classList.contains('favoritado');
            const rota = isFavoritado ? '/desfavoritar-publicacao' : '/favoritar-publicacao';

            fetch(rota, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id: currentUserId,
                    usuario_tipo: currentUserType,
                    publicacao_id: postId
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    button.classList.toggle('favoritado');
                    button.innerHTML = `<i class="fa${button.classList.contains('favoritado') ? 's' : '-regular'} fa-heart"></i>`;
                }
            })
            .catch(error => {
                console.error('Erro ao (des)favoritar:', error);
                alert('Erro ao tentar (des)favoritar a publicação.');
            });
        });
    });

    // Carrega favoritos ao abrir a página
    fetch(`/favoritos-publicacoes/${currentUserType}/${currentUserId}`)
        .then(res => res.json())
        .then(favoritos => {
            document.querySelectorAll('.btn-favoritar').forEach(button => {
                const postId = parseInt(button.getAttribute('data-id'));
                if (favoritos.includes(postId)) {
                    button.classList.add('favoritado');
                    button.innerHTML = `<i class="fas fa-heart"></i>`;
                }
            });
        })
        .catch(error => {
            console.error('Erro ao carregar favoritos:', error);
        });
});
