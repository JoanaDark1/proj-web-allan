document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("extra-fields");

    const btnMedico = document.getElementById("btn-medico");
    const btnEnfermeiro = document.getElementById("btn-enfermeiro");
    const btnGestor = document.getElementById("btn-gestor");

    if (btnMedico) {
        btnMedico.addEventListener("click", () => {
            container.innerHTML = `
                <div class="wrap-input validate-input" data-validate="CRM obrigatório">
                    <input class="input" name="crm" type="text" placeholder="CRM">
                </div>
                <div class="wrap-input validate-input" data-validate="RQM opcional">
                    <input class="input" name="RQM" type="text" placeholder="RQM">
                </div>
            `;
        });
    }

    if (btnEnfermeiro) {
        btnEnfermeiro.addEventListener("click", () => {
            container.innerHTML = `
                <div class="wrap-input validate-input" data-validate="COREN obrigatório">
                    <input class="input" name="coren" type="text" placeholder="COREN">
                </div>
            `;
        });
    }

    if (btnGestor) {
        btnGestor.addEventListener("click", () => {
            container.innerHTML = `
                <div class="wrap-input validate-input" data-validate="Empresa obrigatória">
                    <input class="input" name="empresa" type="text" placeholder="Nome da empresa ou instituição">
                </div>
            `;
        });
    }
});
