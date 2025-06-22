const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const con = require('./database/db.js');
const multer = require('multer'); // npm install multer
const nodemailer = require('nodemailer'); //npm install nodemailer



const app = express();
const port = 3000;

const session = require('express-session');

app.use(session({
    secret: 'sua-chave-secreta',
    resave: false,
    saveUninitialized: false
}));

app.use(express.json());



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

    // Verificando na tabela médicos
    let sql = "SELECT * FROM medicos WHERE email = ? AND senha = ?";
    con.query(sql, [email, senha], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ sucesso: false, mensagem: "Erro ao fazer login." });
        }
        if (result.length > 0) {
            req.session.user = {
                email,
                tipo: 'medico',
                id: result[0].id
            };
            return res.json({
                sucesso: true,
                mensagem: "Login realizado com sucesso.",
                redirectUrl: `/user_profile?tipo=medico&id=${result[0].id}`
            });
        }

        // Verificando na tabela enfermeiros
        sql = "SELECT * FROM enfermeiros WHERE email = ? AND senha = ?";
        con.query(sql, [email, senha], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ sucesso: false, mensagem: "Erro ao fazer login." });
            }
            if (result.length > 0) {
                req.session.user = {
                    email,
                    tipo: 'enfermeiro',
                    id: result[0].id
                };
                return res.json({
                    sucesso: true,
                    mensagem: "Login realizado com sucesso.",
                    redirectUrl: `/user_profile?tipo=enfermeiro&id=${result[0].id}`
                });
            }

            // Verificando na tabela gestores
            sql = "SELECT * FROM gestores WHERE email = ? AND senha = ?";
            con.query(sql, [email, senha], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ sucesso: false, mensagem: "Erro ao fazer login." });
                }
                if (result.length > 0) {
                    req.session.user = {
                        email,
                        tipo: 'gestor',
                        id: result[0].id
                    };
                    return res.json({
                        sucesso: true,
                        mensagem: "Login realizado com sucesso.",
                        redirectUrl: `/user_profile?tipo=gestor&id=${result[0].id}`
                    });
                }

                // Verificando na tabela admin
                sql = "SELECT * FROM admin WHERE email = ? AND senha = ?";
                con.query(sql, [email, senha], (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ sucesso: false, mensagem: "Erro ao fazer login." });
                    }
                    if (result.length > 0) {
                        req.session.user = {
                            email,
                            tipo: 'admin',
                            id: result[0].id
                        };
                        return res.json({
                            sucesso: true,
                            mensagem: "Login realizado com sucesso.",
                            redirectUrl: `/painel-admin`
                        });
                    }

                    // Nenhum match encontrado em nenhuma tabela
                    return res.status(401).json({
                        sucesso: false,
                        mensagem: "Email ou senha inválidos."
                    });
                });
            });
        });
    });
});



app.get('/esqueci_senha', (req, res) => {
    res.render('enviar_email_redefinir_senha'); 
});

app.post('/enviar_email_redefinir_senha', (req, res) => {
    const { email } = req.body;

    const sqlUsuario = `
        SELECT id, nome, email, 'medico' AS tipo FROM medicos WHERE email = ?
        UNION ALL
        SELECT id, nome, email, 'enfermeiro' AS tipo FROM enfermeiros WHERE email = ?
        UNION ALL
        SELECT id, nome, email, 'gestor' AS tipo FROM gestores WHERE email = ?
    `;

    con.query(sqlUsuario, [email, email, email], (err, resultUsuario) => {
        if (err) {
            console.error("Erro ao buscar email do usuário:", err);
            return res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
        }

        if (resultUsuario.length === 0) {
            console.log(`Nenhum usuário encontrado com o email: '${email}'`);
            return res.status(404).json({ sucesso: false, mensagem: "Usuário não encontrado." });
        }

        const usuario = resultUsuario[0];
        const link = `http://localhost:3000/redefinir_senha?tipo=${usuario.tipo}&id=${usuario.id}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });

        const mailOptions = {
            from: 'medoportuna@gmail.com',
            to: email,
            subject: 'Redefinição de Senha - MedOportuna',
            text: `Olá ${usuario.nome},\n\nPara redefinir sua senha, clique no seguinte link:\n${link}\n\nCaso não tenha solicitado, ignore este e-mail.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Erro ao enviar email:", error);
                return res.status(500).json({ sucesso: false, mensagem: "Erro ao enviar o e-mail de redefinição de senha." });
            } else {
                console.log("Email enviado:", info.response);
                return res.status(200).json({ sucesso: true, mensagem: "E-mail de redefinição de senha enviado com sucesso!" });
            }
        });
    });
});


app.get('/redefinir_senha', (req, res) => {
    const { tipo, id } = req.query;
    res.render('redefinir_senha', { tipo, id }); 
});

app.post('/redefinir_senha', (req, res) => {
    const { tipo, id, senha, senha_repeticao } = req.body;



    if (tipo==='medico'||tipo==='enfermeiro') {
        tabela = tipo +'s';
    
        sql = `UPDATE ${tabela} SET senha = ? WHERE id = ?`;
        params = [senha,id]
    }
    else if (tipo === 'gestor') {
        tabela = 'gestores';
         sql = `UPDATE ${tabela} SET senha = ? WHERE id = ?`;
        params =  [senha,id]
    }

    con.query(sql, [senha, id], (err, result) => {
        if (err) {
            console.error("Erro ao atualizar senha:", err);
            return res.status(500).send("Erro interno.");
        }
    res.render('auth/login', { mensagem: 'Senha redefinida com sucesso! Faça login novamente.' });

});
});

app.get('/user_profile', (req, res) => {
    const { tipo, id } = req.query; //pegando os dados da url
     if (!tipo || !id) {
       
        return res.redirect('/templates/auth/login.html');
        
    }
    console.log("Recebido em /user_profile: Tipo =", tipo, "ID =", id);


    let tabela = tipo + 's';
    if (tipo === 'admin') {
        tabela = 'admin';
    }
    else if (tipo === 'gestor') { tabela = 'gestores'; }

    const sqlUsuario = ` SELECT * FROM ${tabela} WHERE id = ? `;
    con.query(sqlUsuario, [id], (err, resultUsuario) => {
        if (err) {
            console.error("Erro na busca de usuário em /user_profile:", err);
            return res.status(500).send("Erro interno do servidor.");
        }
        if (resultUsuario.length === 0) {
            console.log(`Nenhum usuário encontrado na tabela '${tabela}' com ID '${id}'`);
            return res.status(404).send("Usuário não encontrado");
        }

        const usuario = resultUsuario[0];

        // Objeto base com todas as propriedades que o template espera, aqui ta incluindo todos os tipos de usuario juntos
        const dataParaTemplate = {
            tipo: tipo,
            id: usuario.id,
            nome: usuario.nome,
            foto_perfil: usuario.img_perfil || '/images/User_Avatar.png',
            crm: usuario.crm,
            rqe1: usuario.rqe1,
            rqe2: usuario.rqe2,
            especialidade1: usuario.especialidade1,
            especialidade2: usuario.especialidade2,
            coren: usuario.coren,
            empresa_hospital: usuario.empresa_hospital,
            certificados: [], // inicia como array vazio porque talvez o user não tenha certificados
            fav_post: [],
            fav_vaga: []

        };

        // Somente profissionais de saúde têm certificados
        if (tipo === 'medico' || tipo === 'enfermeiro') {
            let fkColumn; //foreign key pra achar o dono do certificado, lembrando que tem uma coluna que é medico_id e outra enfermeiro_id na tabela de certificados
            if (tipo === 'medico') fkColumn = 'medico_id';
            else if (tipo === 'enfermeiro') fkColumn = 'enfermeiro_id';


            //fazer promises pra garantir que os dados sejam carregados antes de renderizar o template

            const promise1 = new Promise((resolve,reject) => {

            const sqlCertificados = `SELECT * FROM certificados WHERE ${fkColumn} = ?`;
            con.query(sqlCertificados, [id], (err, resultCertificados) => { //[id] é o id do usuario que ta logado
                if (err) return resolve([]);
                resolve(resultCertificados);
                
               
            });
             });

            const promise2 = new Promise((resolve,reject) => {
            const sqlFavPost =`SELECT p.* FROM favoritos_publicacoes f
                              JOIN publicacoes p on f.publicacao_id = p.id
                              WHERE f.${fkColumn}=?`;
            con.query(sqlFavPost, [id], (err, resultPosts) => { //[id] é o id do usuario que ta logado
                if (err) return resolve([]);
                resolve(resultPosts)
            });
             });

             const promise3 = new Promise((resolve,reject) => {
            const sqlFavVaga = `SELECT v.* FROM favoritos_vagas f
                                JOIN vagas v on f.vaga_id = v.id
            WHERE f.${fkColumn}=?`;
            con.query(sqlFavVaga, [id], (err,resultVagas) => {
                 if (err) return resolve([]);
                resolve(resultVagas)

            });
             });

        Promise.all([promise1, promise2,promise3]).then(([certificados,fav_post,fav_vaga]) =>{
            dataParaTemplate.certificados = certificados; 
            dataParaTemplate.fav_post = fav_post; 
            dataParaTemplate.fav_vaga = fav_vaga;
            res.render('user_profile', dataParaTemplate);
        })
            .catch((e) => {
                    console.error("Erro ao buscar favoritos ou certificados:", e);
                    res.render('user_profile', dataParaTemplate); // ainda renderiza mas sem  dados
                });


        } else {
            // Para gestores e admins, renderiza imediatamente.

            res.render('user_profile', dataParaTemplate);
        }
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

    // O caminho que via ser salvo é caminho relativo URL-friendly
    // o navegador usa  para acessar a imagem via  middleware express.static('public').
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

app.get('/verificar-acesso', (req, res) => {
    const { profissao } = req.query;

    if (!req.session.user) {
        return res.json({
            autorizado: false,
            mensagem: "Você precisa estar logado para acessar essa área.",
            redirecionarLogin: true
        });
    }

    const tipoUsuario = req.session.user.tipo;

    if (profissao === tipoUsuario) {
        return res.json({ autorizado: true });
    } else {
        return res.json({
            autorizado: false,
            mensagem: `Acesso negado. Esta área é exclusiva para ${profissao}s.`,
            redirecionarLogin: false
        });
    }
});

// Nova rota para adicionar certificados
app.post('/add-certificate', (req, res) => {
    const { userId, userType, titulo, data_emissao, carga_horaria, tipo_certificado } = req.body;

    if (!userId || !userType || !titulo || !data_emissao || !carga_horaria || !tipo_certificado) {
        return res.status(400).json({ success: false, message: 'Todos os campos do certificado são obrigatórios.' });
    }

    if (userType !== 'medico' && userType !== 'enfermeiro') {
        return res.status(403).json({ success: false, message: 'Apenas médicos e enfermeiros podem adicionar certificados.' });
    }

    let medicoId = null;
    let enfermeiroId = null;

    if (userType === 'medico') {
        medicoId = userId;
    } else if (userType === 'enfermeiro') {
        enfermeiroId = userId;
    }

    const sql = `INSERT INTO certificados (titulo, data_emissao, carga_horaria, tipo_certificado, medico_id, enfermeiro_id) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [titulo, data_emissao, carga_horaria, tipo_certificado, medicoId, enfermeiroId];

    con.query(sql, values, (err, result) => {
        if (err) {
            console.error('Erro ao inserir certificado no banco de dados:', err);
            return res.status(500).json({ success: false, message: 'Erro ao salvar o certificado.' });
        }
        res.json({ success: true, message: 'Certificado adicionado com sucesso!', certificateId: result.insertId });
    });
});

// rota pra exibir as publicações
app.get('/posts', (req, res) => {
    if (!req.session.user) {
        // Redireciona para login se não estiver logado
        return res.redirect('/templates/auth/login.html');
    }
    const sql = `SELECT p.*, IFNULL(m.nome, enf.nome) AS nome_autor FROM publicacoes p 
    LEFT JOIN medicos m ON p.medico_id = m.id LEFT JOIN enfermeiros enf ON p.enfermeiro_id
     = enf.id ORDER BY p.data_publicacao DESC`;
    con.query(sql, (err, allPosts) => {
        if (err) {
            console.error('Erro ao buscar publicações:', err);

            return res.status(500).send("Erro ao carregar publicações.");
        }
        res.render('publicacoes.ejs', {
            nome: req.session.user.nome, // Exemplo de como pegar dados do usuário logado
            id: req.session.user.id,
            tipo: req.session.user.tipo,
            publicacoes: allPosts, // Passa TODAS as publicações para o template

        });
    });
});

// Nova rota para adicionar publicações
app.post('/add-post', (req, res) => {
    console.log(req.body);
    const { userId, userType, titulo, data_publicacao, descricao, contato } = req.body;

    if (!userId || !userType || !titulo || !data_publicacao || !descricao || !contato) {
        return res.status(400).json({ success: false, message: 'Todos os campos da publicação são obrigatórios.' });
    }

    if (userType !== 'medico' && userType !== 'enfermeiro') {
        return res.status(403).json({ success: false, message: 'Apenas médicos e enfermeiros podem adicionar publicações.' });
    }

    let medicoId = null;
    let enfermeiroId = null;

    if (userType === 'medico') {
        medicoId = userId;
    } else if (userType === 'enfermeiro') {
        enfermeiroId = userId;
    }

    let formattedDate;
    try {
        const dateObj = new Date(data_publicacao);
        // Formatando para 'YYYY-MM-DD HH:MM:SS porque ele pega o formato ISO 8601
        const year = dateObj.getFullYear();
        const month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
        const day = ('0' + dateObj.getDate()).slice(-2);
        const hours = ('0' + dateObj.getHours()).slice(-2);
        const minutes = ('0' + dateObj.getMinutes()).slice(-2);
        const seconds = ('0' + dateObj.getSeconds()).slice(-2);
        formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
        console.error("Erro ao formatar data_publicacao:", e);

        return res.status(400).json({ success: false, message: 'Formato de data inválido fornecido.' });
    }

    const sql = `INSERT INTO publicacoes (titulo, data_publicacao, descricao, contato, medico_id, enfermeiro_id) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [titulo, formattedDate, descricao, contato, medicoId, enfermeiroId];

    con.query(sql, values, (err, result) => {
        if (err) {
            console.error('Erro ao inserir publicação no banco de dados:', err);
            return res.status(500).json({ success: false, message: 'Erro ao salvar a publicação.' });
        }

        res.json({
            success: true, message: 'publicação adicionada com sucesso!', postId: result.insertId,
            post: {
                id: result.insertId,
                titulo: titulo,
                descricao: descricao,
                contato: contato,
                data_publicacao: data_publicacao,
                nome_autor: req.session.user.nome,
                medicoId: medicoId,
                enfermeiroId: enfermeiroId

            }
        });
    });
});

//pra fazer o update dos dados do usuario
app.post('/update-user-info', (req, res) => {
    // Pega os dados que o frontend enviou no corpo da requisição
    const { userId, userType, ...userData } = req.body;


    if (!userId || !userType) {
        return res.status(400).json({ success: false, message: 'Faltam dados de identificação do usuário.' });
    }

    let sql;
    let params;

    // Monta o comando SQL UPDATE de acordo com o tipo de usuário
    if (userType === 'medico') {
        sql = `UPDATE medicos SET crm = ?, especialidade1 = ?, rqe1 = ?, especialidade2 = ?, rqe2 = ? WHERE id = ?`;
        params = [
            userData.crm || null,
            userData.especialidade1 || null,
            userData.rqe1 || null,
            userData.especialidade2 || null,
            userData.rqe2 || null,
            userId
        ];
    } else if (userType === 'enfermeiro') {
        sql = `UPDATE enfermeiros SET coren = ?, especialidade1 = ? WHERE id = ?`;
        params = [
            userData.coren || null,
            userData.especialidade1 || null,
            userId
        ];
    } else {
        // Se não for médico nem enfermeiro não há o que atualizar.
        return res.status(400).json({ success: false, message: 'Tipo de usuário inválido para esta operação.' });
    }

    // Executa a query no seu banco de dados usando a variável 'con'
    con.query(sql, params, (err, result) => {
        if (err) {
            console.error('Erro ao ATUALIZAR no banco de dados:', err);
            return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
        }

        // Se a query funcionou, envia uma resposta de sucesso para o frontend
        if (result.affectedRows > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Usuário não encontrado no banco de dados.' });
        }
    });


});

app.get('/acessar-publicar-vaga', (req, res) => {
    if (!req.session.user || req.session.user.tipo !== 'gestor') {
        return res.redirect('/templates/auth/login.html');
    }

    // Se for um gestor logado, redireciona para o formulário de publicação
    return res.sendFile(path.join(__dirname, 'public', 'templates', 'publicar-vaga.html'));
});

app.post('/publicar-vaga', (req, res) => {
    const { titulo, descricao, local, remuneracao, profissao, contato } = req.body;
    const data_publicacao = new Date();

    if (!req.session.user || req.session.user.tipo !== 'gestor') {
        return res.status(403).send("Apenas gestores podem publicar vagas.");
    }

    const gestor_id = req.session.user.id;

    const sql = `INSERT INTO vagas (titulo, descricao, local, remuneracao, profissao, data_publicacao, contato, gestor_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    con.query(sql, [titulo, descricao, local, remuneracao, profissao, data_publicacao, contato, gestor_id], (err) => {
        if (err) {
            console.error("Erro ao publicar vaga:", err);
            return res.status(500).send("Erro ao publicar a vaga.");
        }
        res.redirect('/vagas-gestor');
    });
});

app.get('/vagas-:profissao', (req, res) => {
    const { profissao } = req.params;
    const { filtro } = req.query;

    let orderClause = "ORDER BY data_publicacao DESC"; // padrão

    if (filtro === 'local') {
        orderClause = "ORDER BY local ASC";
    } else if (filtro === 'alfabetica') {
        orderClause = "ORDER BY titulo ASC";
    } else if (filtro === 'data') {
        orderClause = "ORDER BY data_publicacao DESC";
    }

    // CASO 1: GESTOR → só vê vagas que ele criou
    if (profissao === 'gestor') {
        if (!req.session.user || req.session.user.tipo !== 'gestor') {
            return res.redirect('/templates/auth/login.html');
        }

        const gestor_id = req.session.user.id;
        let sql = "SELECT * FROM vagas WHERE gestor_id = ?";
        if (filtro === 'local') {
            sql += " ORDER BY local ASC";
        } else if (filtro === 'alfabetica') {
            sql += " ORDER BY titulo ASC";
        } else {
            sql += " ORDER BY data_publicacao DESC"; // padrão
        }

        con.query(sql, [gestor_id], (err, result) => {
            if (err) {
                console.error("Erro ao buscar vagas do gestor:", err);
                return res.status(500).send("Erro ao buscar vagas.");
            }

            return res.render('vagas-gestor', {
                vagas: result,
                id: req.session.user.id,
                tipo: req.session.user.tipo,
                filtro: req.query.filtro || ''
            });
        });

    } else {
        // CASO 2: médico ou enfermeiro → vagas por profissão com filtro
        const sql = `SELECT * FROM vagas WHERE profissao = ? ${orderClause}`;
        con.query(sql, [profissao], (err, result) => {
            if (err) {
                console.error("Erro ao buscar vagas:", err);
                return res.status(500).send("Erro ao buscar vagas.");
            }

            return res.render(`vagas-${profissao}`, {
                vagas: result,
                tipo: req.session.user ? req.session.user.tipo : '',
                id: req.session.user ? req.session.user.id : '',
                filtro: req.query.filtro || ''
            });
        });
    }
});



app.post('/excluir-vaga/:id', (req, res) => {
    if (!req.session.user || req.session.user.tipo !== 'gestor') {
        return res.status(403).send("Acesso negado.");
    }

    const vagaId = req.params.id;
    const gestorId = req.session.user.id;

    // Só permite excluir vaga que pertence ao gestor logado
    const sql = "DELETE FROM vagas WHERE id = ? AND gestor_id = ?";

    con.query(sql, [vagaId, gestorId], (err, result) => {
        if (err) {
            console.error("Erro ao excluir vaga:", err);
            return res.status(500).send("Erro ao excluir vaga.");
        }

        if (result.affectedRows === 0) {
            // Não encontrou vaga ou não pertence ao gestor
            return res.status(404).send("Vaga não encontrada ou acesso negado.");
        }

        // Exclusão ok, redireciona para lista de vagas do gestor
        res.redirect('/vagas-gestor');
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Erro ao destruir a sessão:", err);
            return res.status(500).send("Erro ao tentar fazer logout. Tente novamente.");
        }

        res.redirect('/'); // Ou para '/' (home)
    });
});
//rota do admin
app.get('/painel-admin', (req, res) => {
    if (!req.session.user || req.session.user.tipo !== 'admin') {
        return res.status(403).send("Acesso negado.");
    }

    const sqlAdmins = "SELECT id, nome, email FROM admin";
    const sqlPosts = `SELECT p.*, IFNULL(m.nome, enf.nome) AS nome_autor 
                      FROM publicacoes p 
                      LEFT JOIN medicos m ON p.medico_id = m.id 
                      LEFT JOIN enfermeiros enf ON p.enfermeiro_id = enf.id 
                      ORDER BY p.data_publicacao DESC`;
    const sqlVagas = `SELECT * FROM vagas ORDER BY data_publicacao DESC`;

    // Junta todos os usuários em uma lista unificada com tipo
    const sqlUsuarios = `
        SELECT id, nome, email, 'medico' AS tipo FROM medicos
        UNION
        SELECT id, nome, email, 'enfermeiro' AS tipo FROM enfermeiros
        UNION
        SELECT id, nome, email, 'gestor' AS tipo FROM gestores
    `;

    con.query(sqlAdmins, (err, admins) => {
        if (err) return res.status(500).send("Erro ao carregar admins.");
        con.query(sqlPosts, (err, publicacoes) => {
            if (err) return res.status(500).send("Erro ao carregar publicações.");
            con.query(sqlVagas, (err, vagas) => {
                if (err) return res.status(500).send("Erro ao carregar vagas.");
                con.query(sqlUsuarios, (err, usuarios) => {
                    if (err) return res.status(500).send("Erro ao carregar usuários.");
                    res.render('painel-admin', { nome: req.session.user.email, id: req.session.user.id, admins, publicacoes, vagas, usuarios });
                });
            });
        });
    });
});


app.post('/criar-admin', (req, res) => {
    const { nome, email, senha } = req.body;
    const sql = "INSERT INTO admin (nome, email, senha) VALUES (?, ?, ?)";
    con.query(sql, [nome, email, senha], (err) => {
        if (err) return res.status(500).send("Erro ao criar admin.");
        res.redirect('/painel-admin');
    });
});

app.post('/admin/excluir-post', (req, res) => {
    const { postId } = req.body;
    if (!req.session.user || req.session.user.tipo !== 'admin') {
        return res.status(403).send("Acesso negado.");
    }

    const sql = "DELETE FROM publicacoes WHERE id = ?";
    con.query(sql, [postId], (err) => {
        if (err) return res.status(500).send("Erro ao excluir post.");
        res.redirect('/painel-admin');
    });
});

app.post('/admin/excluir-usuario', (req, res) => {
    if (!req.session.user || req.session.user.tipo !== 'admin') {
        return res.status(403).send("Acesso negado.");
    }

    const { tipo, id } = req.body;
    let tabela;

    if (tipo === 'medico') tabela = 'medicos';
    else if (tipo === 'enfermeiro') tabela = 'enfermeiros';
    else if (tipo === 'gestor') tabela = 'gestores';
    else return res.status(400).send("Tipo de usuário inválido.");

    const sql = `DELETE FROM ${tabela} WHERE id = ?`;
    con.query(sql, [id], (err) => {
        if (err) {
            console.error("Erro ao excluir usuário:", err);
            return res.status(500).send("Erro ao excluir usuário.");
        }
        res.redirect('/painel-admin');
    });
});


app.post('/admin/excluir-vaga', (req, res) => {
    if (!req.session.user || req.session.user.tipo !== 'admin') {
        return res.status(403).send("Acesso negado.");
    }

    const vagaId = req.body.vagaId;

    const sql = "DELETE FROM vagas WHERE id = ?";
    con.query(sql, [vagaId], (err, result) => {
        if (err) {
            console.error("Erro ao excluir vaga como admin:", err);
            return res.status(500).send("Erro ao excluir vaga.");
        }
        res.redirect('/painel-admin');
    });
});

app.post('/admin/excluir-admin', (req, res) => {
    if (!req.session.user || req.session.user.tipo !== 'admin') {
        return res.status(403).send("Acesso negado.");
    }

    const adminId = req.body.id;

    // Proteção contra exclusão do Admin Geral
    const checkSql = "SELECT email FROM admin WHERE id = ?";
    con.query(checkSql, [adminId], (err, result) => {
        if (err || result.length === 0) {
            return res.status(400).send("Admin não encontrado.");
        }

        if (result[0].email === 'admin@medoportuna.com') {
            return res.status(403).send("O Admin Geral não pode ser excluído.");
        }

        const deleteSql = "DELETE FROM admin WHERE id = ?";
        con.query(deleteSql, [adminId], (err) => {
            if (err) {
                console.error("Erro ao excluir admin:", err);
                return res.status(500).send("Erro ao excluir administrador.");
            }
            res.redirect('/painel-admin');
        });
    });
});

app.post('/favoritar-publicacao', (req, res) => {
    const { usuario_id, usuario_tipo, publicacao_id } = req.body;

    let sql;
    let params;

    if (usuario_tipo ==='medico'){
     sql = `INSERT IGNORE INTO favoritos_publicacoes (medico_id, publicacao_id) VALUES (?, ?)`;
        params=[usuario_id,publicacao_id];
    
}
    else if (usuario_tipo === 'enfermeiro') {
          sql = `INSERT IGNORE INTO favoritos_publicacoes (enfermeiro_id, publicacao_id) VALUES (?, ?)`;
             params=[usuario_id,publicacao_id];
    
    } else {
        return res.status(400).json({ success: false, message: 'Tipo de usuário inválido.' });
}

    con.query(sql,params,(err)=>{
        if (err) { return res.status(500).json({ success: false, message: 'Erro ao favoritar publicação.' }); }
        return res.json({ success: true, message: 'Publicação favoritada com sucesso.' });
    });
});

app.get('/favoritos-publicacoes/:tipo/:id', (req, res) => {
    const { tipo, id } = req.params;

    let sql;
    let params;

    if (tipo === 'medico') {
        sql = `SELECT publicacao_id FROM favoritos_publicacoes WHERE medico_id = ?`;
        params = [id];
    } else if (tipo === 'enfermeiro') {
        sql = `SELECT publicacao_id FROM favoritos_publicacoes WHERE enfermeiro_id = ?`;
        params = [id];
    } else {
        return res.status(400).json([]);
    }

    con.query(sql, params, (err, results) => {
        if (err) {
            console.error("Erro ao buscar favoritos de publicações:", err);
            return res.status(500).json([]);
        }
        const favoritos = results.map(r => r.publicacao_id);
        res.json(favoritos);
    });
});

// Favoritar vaga
app.post('/favoritar-vaga', (req, res) => {
    const { usuario_id, usuario_tipo, vaga_id } = req.body;

    let sql;
    let params;

    if (usuario_tipo ==='medico'){
     sql = `INSERT IGNORE INTO favoritos_vagas (medico_id, vaga_id) VALUES ( ?, ?)`;
    params = [usuario_id, vaga_id];}

    else if (usuario_tipo === 'enfermeiro') {
        sql = `INSERT IGNORE INTO favoritos_vagas (enfermeiro_id, vaga_id) VALUES (?, ?)`;
            params = [usuario_id, vaga_id];}

    else {
        return res.status(400).json({ success: false, message: 'Tipo de usuário inválido.' });
}

    con.query(sql,params,(err)=>{
        if (err) { return res.status(500).json({ success: false, message: 'Erro ao favoritar publicação.' }); }
        return res.json({ success: true, message: 'Publicação favoritada com sucesso.' });
    });
});

app.get('/favoritos-vagas/:tipo/:id', (req, res) => {
    const { tipo, id } = req.params;

    let sql;
    let params;

    if (tipo === 'medico') {
        sql = `SELECT vaga_id FROM favoritos_vagas WHERE medico_id = ?`;
        params = [id];
    } else if (tipo === 'enfermeiro') {
        sql = `SELECT vaga_id FROM favoritos_vagas WHERE enfermeiro_id = ?`;
        params = [id];
    } else {
        return res.status(400).json([]);
    }

    con.query(sql, params, (err, results) => {
        if (err) return res.status(500).json([]);
        const favoritos = results.map(r => r.vaga_id);
        return res.json(favoritos);
    });
});

app.post('/desfavoritar-vaga', (req, res) => {
    const { usuario_id, usuario_tipo, vaga_id } = req.body;

    let sql;
    let params;

    if (usuario_tipo === 'medico') {
        sql = `DELETE FROM favoritos_vagas WHERE medico_id = ? AND vaga_id = ?`;
        params = [usuario_id, vaga_id];
    } else if (usuario_tipo === 'enfermeiro') {
        sql = `DELETE FROM favoritos_vagas WHERE enfermeiro_id = ? AND vaga_id = ?`;
        params = [usuario_id, vaga_id];
    } else {
        return res.status(400).json({ success: false, message: 'Tipo de usuário inválido.' });
    }

    con.query(sql, params, (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erro ao desfavoritar vaga.' });
        }
        return res.json({ success: true, message: 'Vaga desfavoritada com sucesso.' });
    });
});

app.post('/desfavoritar-publicacao', (req, res) => {
    const { usuario_id, usuario_tipo, publicacao_id } = req.body;

    let sql;
    let params;

    if (usuario_tipo === 'medico') {
        sql = `DELETE FROM favoritos_publicacoes WHERE medico_id = ? AND publicacao_id = ?`;
        params = [usuario_id, publicacao_id];
    } else if (usuario_tipo === 'enfermeiro') {
        sql = `DELETE FROM favoritos_publicacoes WHERE enfermeiro_id = ? AND publicacao_id = ?`;
        params = [usuario_id, publicacao_id];
    } else {
        return res.status(400).json({ success: false, message: 'Tipo de usuário inválido.' });
    }

    con.query(sql, params, (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erro ao desfavoritar publicação.' });
        }
        return res.json({ success: true, message: 'Publicação desfavoritada com sucesso.' });
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
