const dotenv = require('dotenv');  
dotenv.config({ path: '../.env' });

const con = require("./db.js");


con.connect(function (err) {
  if (err) throw err;
  console.log("CONECTADO!");
  var sqlEnfemeiro = `CREATE TABLE IF NOT EXISTS enfermeiros (
    id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(45) NOT NULL,
    email VARCHAR(45) NOT NULL UNIQUE,
    senha VARCHAR(45) NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    coren VARCHAR(15) UNIQUE NOT NULL,
    especialidade1 VARCHAR(50),
    img_perfil VARCHAR(100)
)`;

  con.query(sqlEnfemeiro, function (err, result) {
    if (err) throw err;
    console.log("Tabela enfermeiros criada");
  });

  //medicos podem ter até 2 especialidades
  var sqlMedico = `CREATE TABLE IF NOT EXISTS medicos (
    id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(45) NOT NULL,
    email VARCHAR(45) NOT NULL UNIQUE,
    senha VARCHAR(45) NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    crm VARCHAR(15) UNIQUE  NOT NULL,
    rqe1 VARCHAR(15) UNIQUE, 
    rqe2 VARCHAR(15) UNIQUE,
    especialidade1 VARCHAR(50),
    especialidade2 VARCHAR(50),
    img_perfil VARCHAR(100)
)`;

  con.query(sqlMedico, function (err, result) {
    if (err) throw err;
    console.log("Tabela medicos criada");
  });

  var sqlGestores = `CREATE TABLE IF NOT EXISTS gestores (
    id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(45) NOT NULL,
    email VARCHAR(45) NOT NULL UNIQUE,
    senha VARCHAR(45) NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    empresa_hospital VARCHAR(60) NOT NULL,
    img_perfil VARCHAR(100)
)`;

  con.query(sqlGestores, function (err, result) {
    if (err) throw err;
    console.log("Tabela gestores criada");
  });

  var sqlAdmin = `CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(45) NOT NULL,
    email VARCHAR(45) NOT NULL UNIQUE,
    senha VARCHAR(45) NOT NULL
)`;

  con.query(sqlAdmin, function (err, result) {
    if (err) throw err;
    console.log("Tabela admin criada");

    const checkAdminSql = "SELECT * FROM admin WHERE email = 'admin@medoportuna.com'";
    con.query(checkAdminSql, function (err, result) {
      if (err) throw err;
      if (result.length === 0) {
        const insertAdminSql = `INSERT INTO admin (nome, email, senha) VALUES ('Admin Geral', 'admin@medoportuna.com', 'admin123')`;
        con.query(insertAdminSql, function (err, result) {
          if (err) throw err;
          console.log("Admin 0 inserido com sucesso.");
        });
      } else {
        console.log("Admin 0 já existe, não será duplicado.");
      }
    });
  });


  // certificados so deverm importar mesmo pros profissionais de saude
  var sqlCertificados = `CREATE TABLE IF NOT EXISTS certificados (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    titulo VARCHAR(150) NOT NULL,
    data_emissao DATE NOT NULL,
    carga_horaria INT NOT NULL,
    tipo_certificado VARCHAR(45) NOT NULL, -- se é de curso ou congresso

    -- fk dos tipos de usuario
    medico_id INT null,
    enfermeiro_id INT null,

    CONSTRAINT fk_certificado_medico 
      FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,

    CONSTRAINT fk_certificado_enfermeiro 
      FOREIGN KEY (enfermeiro_id) REFERENCES enfermeiros(id) ON DELETE CASCADE,

    CONSTRAINT chk_user_type CHECK(
      (medico_id IS NOT NULL AND enfermeiro_id IS NULL) OR 
      (medico_id IS NULL AND enfermeiro_id IS NOT NULL)) -- so um dos 2 pode ser nulo
)`;

  con.query(sqlCertificados, function (err, result) {
    if (err) throw err;
    console.log("Tabela certificados criada");
  });

  var sqlVagas = `CREATE TABLE IF NOT EXISTS vagas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    local VARCHAR(255) NOT NULL,
    remuneracao VARCHAR(255),
    profissao ENUM('medico', 'enfermeiro') NOT NULL,
    data_publicacao DATETIME NOT NULL,
    contato VARCHAR(60) NOT NULL,
    gestor_id INT,
    CONSTRAINT fk_vaga_gestor FOREIGN KEY (gestor_id) REFERENCES gestores(id) ON DELETE CASCADE
)`;

con.query(sqlVagas, function (err, result) {
  if (err) throw err;
  console.log("Tabela vagas criada com chave estrangeira para gestores");
});

  // publicacoes dos profissionais de saude
  var sqlPublicacoes = `CREATE TABLE IF NOT EXISTS publicacoes (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    titulo VARCHAR(150) NOT NULL,
    data_publicacao DATETIME NOT NULL,
    descricao TEXT NOT NULL,
    contato VARCHAR(60) NOT NULL, -- email ou telefone do profissional

    -- fk dos tipos de usuario
    medico_id INT null,
    enfermeiro_id INT null,

    CONSTRAINT fk_publicacao_medico 
      FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,

    CONSTRAINT fk_publicacao_enfermeiro 
      FOREIGN KEY (enfermeiro_id) REFERENCES enfermeiros(id) ON DELETE CASCADE,

    CONSTRAINT chk_user_type_publicacoes CHECK(
      (medico_id IS NOT NULL AND enfermeiro_id IS NULL) OR 
      (medico_id IS NULL AND enfermeiro_id IS NOT NULL)) -- so um dos 2 pode ser nulo
)`;

  con.query(sqlPublicacoes, function (err, result) {
    if (err) throw err;
    console.log("Tabela publicacoes criada");
  });

  var sqlFavoritosPublicacoes = `
CREATE TABLE IF NOT EXISTS favoritos_publicacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- fk dos tipos de usuario
    medico_id INT null,
    enfermeiro_id INT null,
    publicacao_id INT NOT NULL,

 
  
  UNIQUE KEY unique_favorito_medico (medico_id, publicacao_id),
  UNIQUE KEY unique_favorito_enfermeiro (enfermeiro_id, publicacao_id),


  CONSTRAINT fk_post_fav
    FOREIGN KEY (publicacao_id) REFERENCES publicacoes(id) ON DELETE CASCADE,

  CONSTRAINT fk_publicacao_medico_fav 
      FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,

  CONSTRAINT fk_publicacao_enfermeiro_fav
      FOREIGN KEY (enfermeiro_id) REFERENCES enfermeiros(id) ON DELETE CASCADE,

  CONSTRAINT chk_user_type_publicacoes_fav CHECK(
      (medico_id IS NOT NULL AND enfermeiro_id IS NULL) OR 
      (medico_id IS NULL AND enfermeiro_id IS NOT NULL)) -- so um dos 2 pode ser nulo
)`;

con.query(sqlFavoritosPublicacoes, function (err) {
  if (err) throw err;
  console.log("Tabela favoritos_publicacoes criada");
});

var sqlFavoritosVagas = `
CREATE TABLE IF NOT EXISTS favoritos_vagas (
  id INT AUTO_INCREMENT PRIMARY KEY,


  -- fk dos tipos de usuario
    medico_id INT null,
    enfermeiro_id INT null,
    vaga_id INT NOT NULL,


  UNIQUE KEY unique__vaga_med (medico_id, vaga_id),
  UNIQUE KEY unique__vaga_enf (enfermeiro_id, vaga_id),


  CONSTRAINT fk_vaga_fav
    FOREIGN KEY (vaga_id) REFERENCES vagas(id) ON DELETE CASCADE,

  CONSTRAINT fk_vaga_medico 
      FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE,

  CONSTRAINT fk_vaga_enfermeiro 
      FOREIGN KEY (enfermeiro_id) REFERENCES enfermeiros(id) ON DELETE CASCADE,

  CONSTRAINT chk_user_type_vaga CHECK(
      (medico_id IS NOT NULL AND enfermeiro_id IS NULL) OR 
      (medico_id IS NULL AND enfermeiro_id IS NOT NULL)) -- so um dos 2 pode ser nulo
)`;

con.query(sqlFavoritosVagas, function (err) {
  if (err) throw err;
  console.log("Tabela favoritos_vagas criada");
});

});