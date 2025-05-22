const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const Medico = require('./src/models/Medico');
const Enfermeiro = require('./src/models/Enfermeiro');
const Gestor = require('./src/models/Gestor');
const con = require('./database/db.js');

const app = express();
const port = 3000;



app.use(bodyParser.urlencoded({ extended: false }));

//  acessar arquivos HTML, CSS, JS na pasta public
app.use(express.static('public'));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'templates', 'home.html'));
});

con.connect(function (err) {
    if (err) throw err;
    console.log("CONECTADO!");
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    //verificando nas tabelas

    let sql = "SELECT * FROM medicos WHERE email = ? AND senha = ?";
    con.query(sql, [email, senha], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Erro ao fazer login.");
        }
        if (result.length > 0) { //se for maior que 0 achou pelo menos um match
            return res.redirect(`/user_profile?tipo=medico&id=${result[0].id}`);
        }

        //verifcando na tabela enfermeiros
        let sql = "SELECT * FROM enfermeiros WHERE email = ? AND senha = ?";
        con.query(sql, [email, senha], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Erro ao fazer login.");
            }
            if (result.length > 0) {
                return res.redirect(`/user_profile?tipo=enfermeiro&id=${result[0].id}`);
            }

            //verifcando na tabela gestores
            let sql = "SELECT * FROM gestores WHERE email = ? AND senha = ?";
            con.query(sql, [email, senha], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Erro ao fazer login.");
                }
                if (result.length > 0) {
                    return res.redirect(`/user_profile?tipo=gestor&id=${result[0].id}`);
                }

                 //verifcando na tabela Admin
                let sql = "SELECT * FROM admin WHERE email = ? AND senha = ?";
                con.query(sql, [email, senha], (err, result) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send("Erro ao fazer login.");
                    }
                    if (result.length > 0) {
                        return res.redirect(`/user_profile?tipo=admin&id=${result[0].id}`); // talvez o admin não seja redirecionado p/ uma pag de user profile
                    }
                    // caso não exista match em nenhuma tabela
                    return res.status(401).send("Email ou senha inválidos.");


            });
        });
    });
}); });

app.get('/user_profile', (req, res) => { 
    const {tipo, id} = req.query; //pegando os dados da url
    res.send(` ENTROUUU, ${tipo} ${id} seu porraaaaa`);
});


app.post('/add', (req, res) => {  //res = resposta do servidor, req = requisição do cliente

    console.log("Dados recebidos:", req.body);
    const { nome, email, telefone, senha, tipo } = req.body; //req.body objeto que contém todos os campos enviados pelo formulário

    let sql = "";
    let values = [];

    if (tipo === "medico") {
        
        const rqm = req.body.rqm;
        const crm = req.body.crm + '/' + req.body.estado_crm;
        //const { crm, rqm } = req.body
        novo_usuario = new Medico(null,nome,email,senha,telefone,crm,rqm);
        sql = "INSERT INTO medicos(nome,email,senha,crm,rqm,telefone) VALUES (?,?,?,?,?,?)";
        values = [novo_usuario.nome, novo_usuario.email, novo_usuario.senha, novo_usuario.crm, novo_usuario.rqm, novo_usuario.telefone];

    }
    else if (tipo === "enfermeiro") {
        const { coren } = req.body
        novo_usuario = new Enfermeiro(null,nome,email,senha,coren,telefone);
        sql = "INSERT INTO enfermeiros(nome,email,senha,coren,telefone) VALUES (?,?,?,?,?)";
        values = [novo_usuario.nome, novo_usuario.email, novo_usuario.senha, novo_usuario.coren, novo_usuario.telefone];
    }
    else if (tipo === "gestor") {
        const { empresa_hospital } = req.body
        novo_usuario = new Gestor(null,nome,email,senha,empresa_hospital,telefone);
        sql = "INSERT INTO gestores(nome,email,senha,empresa_hospital,telefone) VALUES (?,?,?,?,?)";
        values = [novo_usuario.nome, novo_usuario.email, novo_usuario.senha, novo_usuario.empresa_hospital, novo_usuario.telefone];
    }
    else {
        return res.send("Tipo de usuário inválido.");

    }

    con.query(sql, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Erro ao cadastrar usuário.");
        }
        console.log("Resultado da query: ", result);  // Log do resultado
        res.send("Usuário cadastrado com sucesso!");
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
