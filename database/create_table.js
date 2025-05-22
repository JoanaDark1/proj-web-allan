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
    rqm1 INT UNIQUE, 
    rqm2 INT UNIQUE,
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
  });


  // certificados so deverm importar mesmo pros profissionais de saude
  var sqlCertificados = `CREATE TABLE IF NOT EXISTS certificados (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    titulo VARCHAR(45) NOT NULL,
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
});