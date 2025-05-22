const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const con = require('./database/db.js');



const app = express();
const port = 3000;



app.use(bodyParser.urlencoded({ extended: false }));

//  acessar arquivos HTML, CSS, JS na pasta public
app.use(express.static('public'));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'templates', 'home.html'));
});

// // Configurar o Express para usar EJS como motor de template
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'templates',));


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
    });
});

app.get('/user_profile', (req, res) => {
    const { tipo, id } = req.query; //pegando os dados da url
    console.log("Recebido em /user_profile: Tipo =", tipo, "ID =", id); // Adicione esta linha


    let tabela = tipo + 's';
    if (tipo === 'admin') {
        tabela = 'admin';
    }

    const sql = ` SELECT * FROM ${tabela} WHERE id = ? `;
    con.query(sql, [id], (err, result) => {
        if (err || result.length === 0) {
            return res.status(404).send("Usuário não encontrado");
        }

        const usuario = result[0];
        res.render('user_profile', {
            tipo,
            id: usuario.id,
            nome: usuario.nome,   // ajuste conforme nome da coluna
            foto_perfil: usuario.foto_perfil,
        });
    });


});


app.post('/add', (req, res) => {  //res = resposta do servidor, req = requisição do cliente

    console.log("Dados recebidos:", req.body);
    const { tipo } = req.body; //req.body objeto que contém todos os campos enviados pelo formulário
    const foto_perfil_padrao = path.join(__dirname, 'public', 'images', 'User_Avatar.png');

    let sql = "";
    let values = [];

    if (tipo === "medico") {


        const crm = req.body.crm + '/' + req.body.estado_crm;
        if (req.body.rqm1 === '') {
            const rqm1 = null;
        }

        sql = "INSERT INTO medicos(nome,email,senha,crm,rqm1,telefone,especialidade1,img_perfil) VALUES (?,?,?,?,?,?,?,?)";
        values = [req.body.nome, req.body.email, req.body.senha, crm, rqm1,
        req.body.telefone, req.body.especialidade1, foto_perfil_padrao];

    }
    else if (tipo === "enfermeiro") {
        const coren = req.body.coren + '-' + req.body.coren_tipo;
        
        sql = "INSERT INTO enfermeiros(nome,email,senha,coren,telefone,especialidade1,img_perfil) VALUES (?,?,?,?,?,?,?)";
        values = [req.body.nome, req.body.email, req.body.senha, coren,
        req.body.telefone, req.body.especialidade1, foto_perfil_padrao];
    }
    else if (tipo === "gestor") {
        const { empresa_hospital } = req.body
        
        sql = "INSERT INTO gestores(nome,email,senha,empresa_hospital,telefone,img_perfil) VALUES (?,?,?,?,?,?)";
        values = [req.body.nome, req.body.email, req.body.senha, req.body.empresa_hospital, req.body.telefone, foto_perfil_padrao];
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
        console.log("Usuário cadastrado com sucesso!");
        console.log("ID inserido: ", result.insertId);
        return res.redirect(`/user_profile?tipo=${tipo}&id=${result.insertId}`);


    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
