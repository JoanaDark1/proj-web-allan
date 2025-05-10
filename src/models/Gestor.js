const Usuario = require("./Usuario");

class Gestor extends Usuario{
    constructor({id,nome,email,senha,telefone,empresa_hospital,img_perfil}){
        super ({id, nome,email,senha});
        this.telefone = telefone;
        this.empresa_hospital = empresa_hospital;;
        this.img_perfil = img_perfil || null;

    }

}

module.exports = Gestor;