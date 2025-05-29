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
            certificados: [] // inicia como array vazio porque talvez o user não tenha certificados
        };

        // Somente profissionais de saúde têm certificados
        if (tipo === 'medico' || tipo === 'enfermeiro') {
            let fkColumn; //foreign key pra achar o dono do certificado, lembrando que tem uma coluna que é medico_id e outra enfermeiro_id na tabela de certificados
            if (tipo === 'medico') fkColumn = 'medico_id';
            else if (tipo === 'enfermeiro') fkColumn = 'enfermeiro_id';

            const sqlCertificados = `SELECT * FROM certificados WHERE ${fkColumn} = ?`;
            con.query(sqlCertificados, [id], (err, resultCertificados) => { //[id] é o id do usuario que ta logado
                if (err) {
                    console.error("Erro ao buscar certificados:", err);
                    // Se houver erro, 'certificados' já é um array vazio, o que é seguro
                } else {
                    dataParaTemplate.certificados = resultCertificados; //resultCertificados é um array de objetos, cada objeto é um certificado
                }
                res.render('user_profile', dataParaTemplate);
            });
        } else {
            // Para gestores e admins, renderiza imediatamente.
            // 'certificados' já será um array vazio, então não haverá ReferenceError.
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
    const sql = "SELECT p.*, IFNULL(m.nome, enf.nome) AS nome_autor FROM publicacoes p LEFT JOIN medicos m ON p.medico_id = m.id LEFT JOIN enfermeiros enf ON p.enfermeiro_id = enf.id ORDER BY p.data_publicacao DESC"; // Exemplo de query
    con.query(sql, (err, allPosts) => {
        if (err) {
            console.error('Erro ao buscar publicações:', err);
            // Tratar erro, talvez renderizar página de erro
            return res.status(500).send("Erro ao carregar publicações.");
        }
        res.render('publicacoes.ejs', { // o nome do seu arquivo .ejs
            nome: req.session.user.nome, // Exemplo de como pegar dados do usuário logado
            id: req.session.user.id,
            tipo: req.session.user.tipo,
            publicacoes: allPosts, // Passa TODAS as publicações para o template
            // outras variáveis necessárias para o template como titulo, data_publicacao, descricao, contato singulares (se ainda forem necessárias)
        });
    });
});

// Nova rota para adicionar publicações
app.post('/add-post', (req, res) => {
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

    const sql = `INSERT INTO publicacoes (titulo, data_publicacao, descricao, contato, medico_id, enfermeiro_id) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [titulo, data_publicacao, descricao, contato, medicoId, enfermeiroId];

    con.query(sql, values, (err, result) => {
        if (err) {
            console.error('Erro ao inserir publicação no banco de dados:', err);
            return res.status(500).json({ success: false, message: 'Erro ao salvar a publicação.' });
        }
        res.json({ success: true, message: 'publicação adicionada com sucesso!', postId: result.insertId });
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
    const { titulo, descricao, local, remuneracao, profissao } = req.body;
    const data_publicacao = new Date();

    if (!req.session.user || req.session.user.tipo !== 'gestor') {
        return res.status(403).send("Apenas gestores podem publicar vagas.");
    }

    const gestor_id = req.session.user.id;

    const sql = `INSERT INTO vagas (titulo, descricao, local, remuneracao, profissao, data_publicacao, gestor_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    con.query(sql, [titulo, descricao, local, remuneracao, profissao, data_publicacao, gestor_id], (err) => {
        if (err) {
            console.error("Erro ao publicar vaga:", err);
            return res.status(500).send("Erro ao publicar a vaga.");
        }
        res.redirect('/vagas-gestor');
    });
});

app.get('/vagas-:profissao', (req, res) => {
    const { profissao } = req.params;

    if (profissao === 'gestor') {
        if (!req.session.user || req.session.user.tipo !== 'gestor') {
            return res.redirect('/templates/auth/login.html');
        }
        const gestor_id = req.session.user.id;
        const sql = "SELECT * FROM vagas WHERE gestor_id = ? ORDER BY data_publicacao DESC";
        con.query(sql, [gestor_id], (err, result) => {
            if (err) {
                console.error("Erro ao buscar vagas do gestor:", err);
                return res.status(500).send("Erro ao buscar vagas.");
            }
            return res.render('vagas-gestor', { vagas: result });
        });

    } else {
        const sql = "SELECT * FROM vagas WHERE profissao = ? ORDER BY data_publicacao DESC";
        con.query(sql, [profissao], (err, result) => {
            if (err) {
                console.error("Erro ao buscar vagas:", err);
                return res.status(500).send("Erro ao buscar vagas.");
            }
            return res.render(`vagas-${profissao}`, { vagas: result });
        });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
