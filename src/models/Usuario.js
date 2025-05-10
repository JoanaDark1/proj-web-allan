class Usuario {
    constructor({id,nome,email,senha}){
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
    }

    static async findByEmail(email){
        throw new Error("Método findByEmail deve ser implementado pela subclase.");
    }
    static async findById(id) {
        throw new Error('Método findById deve ser implementado pela subclasse');
    }

    async save() {
        throw new Error('Método save deve ser implementado pela subclasse');
    }
}
module.exports = Usuario;