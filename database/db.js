const dotenv = require('dotenv');  
dotenv.config({ path: '../.env' });

var mysql = require('mysql2');

var con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,	
  database: process.env.DB_NAME
});

con.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conectado ao MySQL!');
});

module.exports = con;