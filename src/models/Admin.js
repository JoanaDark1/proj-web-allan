const Usuario = require("./Usuario");

class Admin extends Usuario {
    constructor({id,nome,email,senha}){
        super ({id, nome,email,senha});
    }
    
}

module.exports = Admin;