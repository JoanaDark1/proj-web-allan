document.addEventListener('DOMContentLoaded', () => {


        // Perfil e Foto
        const editButton = document.getElementById('editProfilePic');
        const fileInput = document.getElementById('fileInput');
        const profileImage = document.getElementById('profileImage');

        // Edição de Informações
        const editInfoBtn = document.getElementById('editInfoBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        const viewModeDiv = document.getElementById('view-mode-details');
        const editModeForm = document.getElementById('edit-mode-form');

        // Certificados
        const addCertificateForm = document.getElementById('addCertificateForm');
        const toggleAddCertificateBtn = document.getElementById('toggleAddCertificateBtn');
        const addCertificateWrapper = document.getElementById('addCertificateWrapper');


        // --- LÓGICA PARA EDITAR INFORMAÇÕES DO PERFIL ---
        if (editInfoBtn && cancelEditBtn && viewModeDiv && editModeForm) { // so inicia se existir todos os elementos
            // Ao clicar em "Editar"
            editInfoBtn.addEventListener('click', () => {
                viewModeDiv.style.display = 'none';
                editModeForm.style.display = 'block'; // o form de edit aparece
                editInfoBtn.style.display = 'none'; // Esconde o botão de editar
            });

            // Ao clicar em "Cancelar"
            cancelEditBtn.addEventListener('click', () => {
                viewModeDiv.style.display = 'block'; // mostra as infos
                editModeForm.style.display = 'none'; //esconde o form de edit
                editInfoBtn.style.display = 'block'; // Mostra o botão de editar denovo
            });

            // ativa quando clica em um botao com submit
            editModeForm.addEventListener('submit', (event) => {
                event.preventDefault(); // Impede o recarregamento da página

                const formData = new FormData(editModeForm); //O FormData coleta TODOS os dados do form
                const userData = {};
                formData.forEach((value, key) => { //key é o nome do campo, value é o valor e e ta percorrendo todos os campos do form
                    userData[key] = value;
                });

                //  ID e o tipo do usuário ta pegando do body do html e tem uma conversao no jeito que escreve e passa pra ca
                userData.userId  = document.body.dataset.userId;
                userData.userType = document.body.dataset.userType.trim();

                

                // Envia os dados para o servidor
                fetch('/update-user-info', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                })
                .then(response => {
                    if (!response.ok) {
                        // Se a resposta não for OK (ex: 404, 500), lança um erro para o .catch
                        throw new Error(`Erro HTTP: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        alert('Informações atualizadas com sucesso!');
                        location.reload(); // Recarrega a página
                    } else {
                        alert('Erro ao atualizar informações: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Erro na requisição fetch:', error);
                    alert('Ocorreu um erro de comunicação com o servidor. Verifique o console (F12) para detalhes.');
                });
            });
        }

        // --- LÓGICA PARA ADICIONAR post ---
        if (toggleAddPostBtn && addPostWrapper) {
            toggleAddPostBtn.addEventListener('click', () => {
                if (addPostWrapper.style.display === 'none') {
                    addPostWrapper.style.display = 'block';
                    toggleAddPostBtn.textContent = 'Cancelar';
                } else {
                    addPostWrapper.style.display = 'none';
                    toggleAddPostBtn.textContent = 'Adicionar Nova Publicação';
                }
            });
        }

        if (addPostForm) {
            addPostForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const formData = new FormData(addPostForm);
                const postData = {};
                formData.forEach((value, key) => {
                    postData[key] = value;
                });

                fetch('/add-post', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(postData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Certificado adicionado com sucesso!');
                        location.reload();
                    } else {
                        alert('Erro ao adicionar certificado: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Erro na requisição de adicionar certificado:', error);
                    alert('Ocorreu um erro ao adicionar o certificado.');
                });
            });
        }

        

        
    });