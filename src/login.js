
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

    function validate(input) {
        if ($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
            // se falha no regex de email
            if ($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((([a-zA-Z0-9\-]+\.)+))([a-zA-Z])$/) == null) {
                return false;
            }
        }
        else {
            if ($(input).val().trim == '') {
                return false;
            }
        }
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
    var showPass = 0;
    $('.btn-show-pass').on('click', function(){
        if(showPass == 0) {
            $(this).next('input').attr('type','text');
            $(this).addClass('active');
            showPass = 1;
        }
        else {
            $(this).next('input').attr('type','password');
            $(this).removeClass('active');
            showPass = 0;
        }
        
    });

})(jQuery);