
(function ($) {
    "use strict";

    /* Focus input */
    $('.input').each(function () {
        $(this).on('blur', function () {
            if ($(this).val().trim() != "") {
                $(this).addClass('tem-valor')
            }
            else {
                $(this).removeClass('tem-valor')
            }
        })
    })

    /* Validate */

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

})(jQuery);