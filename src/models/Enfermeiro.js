const Usuario = require("./Usuario");

class Enfermeiro extends Usuario {
    constructor({ id, nome, email, senha, telefone,coren, img_perfil }) {
        super({ id, nome, email, senha });
        this.telefone = telefone;
        this.coren = coren;
        this.img_perfil = img_perfil|| null;
    }
}

module.exports = Enfermeiro;