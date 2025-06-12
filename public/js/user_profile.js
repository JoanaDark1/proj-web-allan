document.addEventListener('DOMContentLoaded', () => {
    // PERFIL E FOTO
    const editButton = document.getElementById('editProfilePic');
    const fileInput = document.getElementById('fileInput');
    const profileImage = document.getElementById('profileImage');

    // EDIÇÃO DE INFORMAÇÕES
    const editInfoBtn = document.getElementById('editInfoBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const viewModeDiv = document.getElementById('view-mode-details');
    const editModeForm = document.getElementById('edit-mode-form');

    // CERTIFICADOS
    const addCertificateForm = document.getElementById('addCertificateForm');
    const toggleAddCertificateBtn = document.getElementById('toggleAddCertificateBtn');
    const addCertificateWrapper = document.getElementById('addCertificateWrapper');

    // --- EDITAR PERFIL ---
    if (editInfoBtn && cancelEditBtn && viewModeDiv && editModeForm) {
        editInfoBtn.addEventListener('click', () => {
            viewModeDiv.style.display = 'none';
            editModeForm.style.display = 'block';
            editInfoBtn.style.display = 'none';
        });

        cancelEditBtn.addEventListener('click', () => {
            viewModeDiv.style.display = 'block';
            editModeForm.style.display = 'none';
            editInfoBtn.style.display = 'block';
        });

        editModeForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(editModeForm);
            const userData = {};
            formData.forEach((value, key) => userData[key] = value);
            userData.userId = document.body.dataset.userId;
            userData.userType = document.body.dataset.userType.trim();

            fetch('/update-user-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            })
            .then(response => {
                if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert('Informações atualizadas com sucesso!');
                    location.reload();
                } else {
                    alert('Erro ao atualizar informações: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erro na requisição fetch:', error);
                alert('Erro de comunicação com o servidor.');
            });
        });
    }

    // --- ADICIONAR CERTIFICADO ---
    if (toggleAddCertificateBtn && addCertificateWrapper) {
        toggleAddCertificateBtn.addEventListener('click', () => {
            const show = addCertificateWrapper.style.display === 'none';
            addCertificateWrapper.style.display = show ? 'block' : 'none';
            toggleAddCertificateBtn.textContent = show ? 'Cancelar' : 'Adicionar Novo Certificado';
        });
    }

    if (addCertificateForm) {
        addCertificateForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(addCertificateForm);
            const certificateData = {};
            formData.forEach((value, key) => certificateData[key] = value);

            fetch('/add-certificate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(certificateData)
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

    // --- UPLOAD DE FOTO ---
    if (editButton && fileInput) {
        editButton.addEventListener('click', () => fileInput.click());
    }

    if (fileInput && profileImage) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profileImage.src = e.target.result;
                    uploadProfilePicture(file);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function uploadProfilePicture(file) {
        const userId = document.body.dataset.userId;
        const userType = document.body.dataset.userType;
        const formData = new FormData();
        formData.append('profilePic', file);
        formData.append('userId', userId);
        formData.append('userType', userType);

        fetch('/upload-profile-pic', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Foto de perfil atualizada com sucesso!');
            } else {
                alert('Erro ao atualizar foto de perfil: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro na requisição de upload:', error);
            alert('Ocorreu um erro ao enviar a foto.');
        });
    }

    // --- FAVORITAR / DESFAVORITAR ---
    document.querySelectorAll(".btn-favoritar").forEach(button => {
        button.addEventListener("click", () => {
            const itemId = button.getAttribute("data-id");
            const tipo = button.getAttribute("data-tipo"); // 'vaga' ou 'publicacao'
            const userId = document.body.dataset.userId;
            const userType = document.body.dataset.userType.trim();
            const icon = button.querySelector("i");

            const isFavorited = icon.classList.contains("fa-solid");

            const url = isFavorited
                ? (tipo === 'vaga' ? '/desfavoritar-vaga' : '/desfavoritar-publicacao')
                : (tipo === 'vaga' ? '/favoritar-vaga' : '/favoritar-publicacao');

            const body = {
                usuario_id: userId,
                usuario_tipo: userType
            };
            body[tipo === 'vaga' ? 'vaga_id' : 'publicacao_id'] = itemId;

            fetch(url, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    icon.classList.toggle("fa-solid");
                    icon.classList.toggle("fa-regular");
                    button.title = isFavorited ? "Favoritar" : "Desfavoritar";
                } else {
                    alert(data.message || "Erro ao processar favorito.");
                }
            })
            .catch(err => {
                console.error("Erro:", err);
                alert("Erro de comunicação com o servidor.");
            });
        });
    });
});
