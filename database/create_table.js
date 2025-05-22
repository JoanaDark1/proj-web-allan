var mysql = require('mysql2');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  //password: "87Amore;;w34",
  //password: "1234",
  //password: "abacaxi1401",
  database: "med_oportuna"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("CONECTADO!");
  var sqlEnfemeiro = `CREATE TABLE IF NOT EXISTS enfermeiros (
    id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(45) NOT NULL,
    email VARCHAR(45) NOT NULL UNIQUE,
    senha VARCHAR(45) NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    coren INT UNIQUE,
    img_perfil VARCHAR(100)
)`;

con.query(sqlEnfemeiro, function (err, result) {
  if (err) throw err;
  console.log("Tabela enfermeiros criada");
});

var sqlMedico = `CREATE TABLE IF NOT EXISTS medicos (
    id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(45) NOT NULL,
    email VARCHAR(45) NOT NULL UNIQUE,
    senha VARCHAR(45) NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    crm VARCHAR(10) UNIQUE  NOT NULL,
    rqm INT UNIQUE,
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
});