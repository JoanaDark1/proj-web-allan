const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));

//  acessar arquivos HTML, CSS, JS na pasta public
app.use(express.static('public'));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'templates', 'home.html'));
});

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "87Amore;;w34",
    database: "med_oportuna"
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
                // caso não exista match em nenhuma tabela
                return res.status(401).send("Email ou senha inválidos.");


            });
        });
    });
});

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
        const { crm, rqm } = req.body
        sql = "INSERT INTO medicos(nome,email,senha,crm,rqm,telefone) VALUES (?,?,?,?,?,?)";
        values = [nome, email, senha, crm, rqm, telefone];

    }
    else if (tipo === "enfermeiro") {
        const { coren } = req.body
        sql = "INSERT INTO enfermeiros(nome,email,senha,coren,telefone) VALUES (?,?,?,?,?)";
        values = [nome, email, senha, coren, telefone];
    }
    else if (tipo === "gestor") {
        const { empresa_hospital } = req.body
        sql = "INSERT INTO gestores(nome,email,senha,empresa_hospital,telefone) VALUES (?,?,?,?,?)";
        values = [nome, email, senha, empresa_hospital, telefone];
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

