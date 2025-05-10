const Usuario = require("./Usuario");

class Medico extends Usuario {
    constructor({ id, nome, email, senha, telefone, crm, rqm, img_perfil }) {
        super({ id, nome, email, senha });
        this.telefone = telefone;
        this.crm = crm;
        this.rqm = rqm;
        this.img_perfil = img_perfil || null;
    }
}

module.exports = Medico;