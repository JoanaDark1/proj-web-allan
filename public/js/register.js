document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("extra-fields");
    const form = document.querySelector(".auth-form");
    const btnMedico = document.getElementById("btn-medico");
    const btnEnfermeiro = document.getElementById("btn-enfermeiro");
    const btnGestor = document.getElementById("btn-gestor");
    const btnSubmit = document.getElementsByClassName("login-form-btn")[0];
    //const email = document.getElementsByName("email");
    const senha = document.getElementsByName("senha")[0];
    const senha_repeticao = document.getElementsByName("senha_repeticao")[0];

    btnSubmit.disabled = true; // desabilitado ate escolher o tipo de usuario


    if (btnMedico) {
        btnMedico.addEventListener("click", () => {
            btnSubmit.disabled = false; // habilitar o botão de submit
            document.getElementById("tipo-usuario").value = "medico";
            container.innerHTML = `
                <div class="wrap-input validate-input" data-validate="CRM obrigatório">
                    <input class="input" name="crm" type="text" placeholder="CRM" required>
                </div>
                <div class="wrap-input validate-input" data-validate="RQM opcional">
                    <input class="input" name="rqm" type="text" placeholder="RQM">
                </div>
            `;
        });
    }

    if (btnEnfermeiro) {
        btnEnfermeiro.addEventListener("click", () => {
            btnSubmit.disabled = false; // habilitar o botão de submit
            document.getElementById("tipo-usuario").value = "enfermeiro";
            container.innerHTML = `
                <div class="wrap-input validate-input" data-validate="COREN obrigatório">
                    <input class="input" name="coren" type="text" placeholder="COREN" required> 
                </div>
            `;
        });
    }

    if (btnGestor) {
        btnGestor.addEventListener("click", () => {
            btnSubmit.disabled = false; // habilitar o botão de submit
            document.getElementById("tipo-usuario").value = "gestor";
            container.innerHTML = `
                <div class="wrap-input validate-input" data-validate="Empresa obrigatória">
                    <input class="input" name="empresa_hospital" type="text" placeholder="Nome da empresa ou instituição" required>
                </div>
            `;
        });
    }


    /* Validate */

    function validate(input) {
        if ($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
            // se falha no regex de email
            if ($(input).val().trim().match(/^([a-z0-9_\-\.]+)@((([a-z0-9\-]+\.)+))([a-z]{2,})$/i) == null) {
                return false;
            }
        }


        else {
            if ($(input).val().trim() == '') {
                return false;
            }
        }
        return true;
    }

    function showValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).addClass('alert-validate');

    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('alert-validate');
    }


    var input = $('.validate-input .input');

    $('.validate-form').on('submit', function () {
        var check = true;
        // loop pra validar todos os inputs
        for (var i = 0; i < input.length; i++) {
            if (validate(input[i]) == false) {
                showValidate(input[i]);
                check = false;
            }
        }
        // agora compara senhas
        if (senha.value !== senha_repeticao.value) {
            showValidate(senha_repeticao);
            check = false;
        }
        return check;
    });

    // quando clicar no campo ele some a mensagem de erro
    $('.validate-form .input').each(function () {
        $(this).focus(function () {
            hideValidate(this)
        });
    });


    /*mostrar senha*/

    $('.btn-show-pass').on('click', function (e) {
        e.preventDefault(); // impede o botão de tentar enviar o formulário

        const input = $(this).siblings('input');
        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            $(this).addClass('active');

        }
        else {
            input.attr('type', 'password');
            $(this).removeClass('active');

        }

    });
});
