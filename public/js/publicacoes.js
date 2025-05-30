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
               if(!addPostWrapper.classList.contains('hidden')) {
                    toggleAddPostBtn.textContent = '➖Cancelar';
                } else{
                    toggleAddPostBtn.textContent = '➕Nova Publicação';
                }
                formMessage.textContent ='';
                addPostForm.reset();

            }); 
        }
        if(cancelPostBtn){
            cancelPostBtn.addEventListener('click',() =>{
                addPostWrapper.classList.add('hidden');
                if(toggleAddPostBtn){
                    toggleAddPostBtn.textContent = '➕Nova Publicação';
                }
                formMessage.textContent ='';
                addPostForm.reset();
            });
        }

        if (addPostForm) {
            addPostForm.addEventListener('submit',  (event) => {

        
                event.preventDefault();
                formMessage.textContent='';

                const formData = new FormData(addPostForm); //O FormData coleta TODOS os dados do form
                const postData = {};
                formData.forEach((value, key) => { 
                    postData[key] = value;
                });

                postData.userId  = currentUserId;
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
                        // Se a resposta não for OK (ex: 404, 500), lança um erro para o .catch
                        throw new Error(`Erro HTTP: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        // alert('Publicação  adicionada com sucesso!');
                        location.reload(); // Recarrega a página
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
        
    });