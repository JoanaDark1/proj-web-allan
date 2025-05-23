const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const con = require('./database/db.js');
const multer = require('multer'); // npm install multer



const app = express();
const port = 3000;

const session = require('express-session');

app.use(session({
    secret: 'sua-chave-secreta',
    resave: false,
    saveUninitialized: false
}));


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

// Configuração do Multer para armazenamento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'public', 'images', 'profile_images');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Gera um nome de arquivo único para evitar conflitos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

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
            if (result.length > 0) {
            req.session.user = {
                email,
                tipo: 'medico',
                id: result[0].id
            };
            return res.redirect(`/user_profile?tipo=medico&id=${result[0].id}`);
            }
        }

        //verifcando na tabela enfermeiros
        let sql = "SELECT * FROM enfermeiros WHERE email = ? AND senha = ?";
        con.query(sql, [email, senha], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Erro ao fazer login.");
            }
            if (result.length > 0) {
                req.session.user = {
                    email,
                    tipo: 'enfermeiro',
                    id: result[0].id
                };
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
                    req.session.user = {
                        email,
                        tipo: 'gestor',
                        id: result[0].id
                    };
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
                        req.session.user = {
                            email,
                            tipo: 'admin',
                            id: result[0].id
                        };
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
    else if (tipo === 'gestor') { tabela = 'gestores'; }

    const sql = ` SELECT * FROM ${tabela} WHERE id = ? `;
    con.query(sql, [id], (err, result) => {
        if (err || result.length === 0) {
            return res.status(404).send("Usuário não encontrado");
        }

        const usuario = result[0];
        const dataParaTemplate = {
            tipo: tipo,
            id: usuario.id,
            nome: usuario.nome,
            foto_perfil: usuario.img_perfil || '/images/User_Avatar.png', 
            crm: undefined, 
            rqe1: undefined,
            rqe2: undefined,
            especialidade1: undefined,
            especialidade2: undefined,
            coren: undefined,
            empresa_hospital: undefined
        };
        // Adicione as propriedades específicas baseadas no tipo
        if (tipo === 'medico') {
            dataParaTemplate.crm = usuario.crm;
            dataParaTemplate.rqe1 = usuario.rqe1;
            dataParaTemplate.rqe2 = usuario.rqe2;
            dataParaTemplate.especialidade1 = usuario.especialidade1;
            dataParaTemplate.especialidade2 = usuario.especialidade2;
        } else if (tipo === 'enfermeiro') {
            dataParaTemplate.coren = usuario.coren;
            dataParaTemplate.especialidade1 = usuario.especialidade1;
        } else if (tipo === 'gestor') {
            dataParaTemplate.empresa_hospital = usuario.empresa_hospital;
        }

        res.render('user_profile', dataParaTemplate)
    });


});


app.post('/add', (req, res) => {  //res = resposta do servidor, req = requisição do cliente

    console.log("Dados recebidos:", req.body);
    const { tipo } = req.body; //req.body objeto que contém todos os campos enviados pelo formulário
    const foto_perfil_padrao = '/images/User_Avatar.png';

    let sql = "";
    let values = [];

    if (tipo === "medico") {


        const crm = req.body.crm + '/' + req.body.estado_crm;


        sql = "INSERT INTO medicos(nome,email,senha,crm,rqe1,telefone,especialidade1,img_perfil) VALUES (?,?,?,?,?,?,?,?)";
        values = [req.body.nome, req.body.email, req.body.senha, crm, req.body.rqe1,
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

// Nova rota para upload de foto de perfil
app.post('/upload-profile-pic', upload.single('profilePic'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Nenhuma foto enviada.' });
    }

    // O caminho que será salvo no banco de dados deve ser o caminho relativo URL-friendly
    // que o navegador usará para acessar a imagem via seu middleware express.static('public').
    const newImagePath = '/images/profile_images/' + req.file.filename;
    
    const userId = req.body.userId;
    const userType = req.body.userType;

    let tableName;
    if (userType === 'medico') {
        tableName = 'medicos';
    } else if (userType === 'enfermeiro') {
        tableName = 'enfermeiros';
    } else if (userType === 'gestor') {
        tableName = 'gestores';
    } else {
        return res.status(400).json({ success: false, message: 'Tipo de usuário inválido.' });
    }

    // Atualiza o caminho da imagem no banco de dados
    const sql = `UPDATE ${tableName} SET img_perfil = ? WHERE id = ?`; 
    con.query(sql, [newImagePath, userId], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar foto no banco de dados:', err);
            return res.status(500).json({ success: false, message: 'Erro interno do servidor ao salvar a foto.' });
        }

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Foto atualizada com sucesso!', newImageUrl: newImagePath });
        } else {
            res.status(404).json({ success: false, message: 'Usuário não encontrado para atualização.' });
        }
    });
});

// talvez va embora
app.get('/verificar-usuario', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/templates/auth/login.html');
    }

    const { tipo } = req.session.user;

    return res.redirect(`/vagas-${tipo}.html`);
});

app.get('/verificar-sessao', (req, res) => {
    if (req.session.user) {
        res.json({ logado: true });
    } else {
        res.json({ logado: false });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
