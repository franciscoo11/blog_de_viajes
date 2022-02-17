const express = require('express');
const aplicacion = express();
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('express-flash');

var pool = mysql.createPool({
  connectionLimit: 200,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'blog_viajes',
});

aplicacion.use(bodyParser.json());
aplicacion.use(bodyParser.urlencoded({ extended: true }));
aplicacion.set('view engine', 'ejs');
aplicacion.use(
  session({
    secret: 'token-muy-secreto',
    resave: true,
    saveUninitialized: true,
  })
);
aplicacion.use(flash());
aplicacion.use(express.static('public'));

aplicacion.get('/', function (peticion, respuesta) {
  pool.getConnection(function (err, connection) {
    const consulta = `SELECT 
    titulo, resumen, fecha_hora, pseudonimo, votos 
    FROM publicaciones 
    INNER JOIN autores 
    ON publicaciones.autor_id = autores.id 
    ORDER BY fecha_hora DESC 
    LIMIT 5
    `;
    connection.query(consulta, function (error, filas, campos) {
      respuesta.render('index', { publicaciones: filas });
    });
    connection.release();
  });
});

aplicacion.get('/registro', function (req, res) {
  res.render('registro', { mensaje: req.flash('mensaje') });
});

aplicacion.post('/procesar_registro', function (req, res) {
  pool.getConnection(function (err, connection) {
    const email = req.body.email.toLowerCase().trim();
    const pseudonimo = req.body.pseudonimo.trim();
    const contrasena = req.body.contrasena;

    const consultaEmail = `
        SELECT *
        FROM autores
        WHERE EMAIL = ${connection.escape(email)}
    `;
    connection.query(consultaEmail, function (error, filas, columnas) {
      if (filas.length > 0) {
        req.flash('mensaje', 'Email duplicado');
        res.redirect('/registro');
      } 
      else {

        const consulta = `
          INSERT INTO 
          autores 
          (email,contrasena,pseudonimo)
          VALUES (
            ${connection.escape(email)},
            ${connection.escape(contrasena)},
            ${connection.escape(pseudonimo)}
          )
       `;
        connection.query(consulta, function (error, filas, columnas) {
          req.flash('mensaje', 'Usuario registrado');
          res.redirect('/registro');
        });
      }
    });
    connection.release();
  });
});

aplicacion.get('/inicio', function (req, res) {
  res.render('inicio', { mensaje: req.flash('mensaje') })
})


aplicacion.post('/procesar_inicio', function (req, res) {
  pool.getConnection(function (err, connection) {
    const consulta = `
      SELECT *
      FROM autores
      WHERE
      email = ${connection.escape(req.body.email)} AND
      contrasena = ${connection.escape(req.body.contrasena)}
    `
    connection.query(consulta, function (error, filas, campos) {
      if (filas.length > 0) {
        req.session.usuario = filas[0]
        res.redirect('/admin/index')
      }
      else {
        req.flash('mensaje', 'Datos inválidos')
        res.redirect('/inicio')
      }

    })
    connection.release()
  })
})


aplicacion.get('/admin/index', function (req, res) {
  pool.getConnection(function, (err, connection({ 
    const consulta = `
      SELECT * 
      FROM publicaciones
      WHERE
      autor_id = ${connection.escape(req.session.usuario.id)}
    `
    connection.query(consulta, function (err,filas,columnas){
      res.render('admin/index', { usuario: req.session.usuario, mensaje: req.flash('mensaje'), publicaciones : filas })
    })
    connection.release()
  })
})

aplicacion.get('/procesar_cerrar_sesion', function (req, res) {
  req.session.destroy();
  res.redirect("/")
});

aplicacion.listen(8080, function () {
  console.log('Servidor iniciado');
});
