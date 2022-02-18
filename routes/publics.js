const express = require('express')
const router = express.Router()
const mysql = require('mysql')

var pool = mysql.createPool({
  connectionLimit: 20,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'blog_viajes'
})

router.get('/', (req, res) => {
  pool.getConnection((err, connection) => {
    let consulta
    let modificadorConsulta= ""
    let pagina = 0
    let modificadorPagina = ""

    const busqueda = ( req.query.busqueda ) ? req.query.busqueda : ""
    if (busqueda != "") {
      modificadorConsulta = `
      WHERE
      titulo LIKE '%${busqueda}%' OR
      resumen LIKE '%${busqueda}%' OR
      contenido LIKE '%${busqueda}%'
      `
      modificadorPagina = ""
    }
    else {
      pagina = ( req.query.pagina ) ? parseInt(req.query.pagina) : 0 
      if (pagina < 0){
        pagina = 0
      }
      modificadorPagina = `
      LIMIT 5 OFFSET ${pagina*5}
      `
    }
    consulta = `
      SELECT
      titulo, resumen, fecha_hora, pseudonimo, votos
      FROM publicaciones
      INNER JOIN autores
      ON publicaciones.autor_id = autores.id
      ${modificadorConsulta}
      ORDER BY fecha_hora DESC
      ${modificadorPagina}
    `
    connection.query(consulta, (error, filas, campos) => {
      res.render('index', { publicaciones: filas, busqueda: busqueda, pagina : pagina })
    })
    connection.release()
  })
})

router.get('/registro', (req, res) => {
  respuesta.render('registro', { mensaje: req.flash('mensaje') })
})

router.post('/procesar_registro', (req, res) => {
  pool.getConnection((err, connection) => {
    const email = req.body.email.toLowerCase().trim()
    const pseudonimo = req.body.pseudonimo.trim()
    const contrasena = req.body.contrasena
    const consultaEmail = `
      SELECT *
      FROM autores
      WHERE email = ${connection.escape(email)}
    `
    connection.query(consultaEmail, (error, filas, campos) => {
      if (filas.length > 0) {
        req.flash('mensaje', 'Email duplicado')
        res.redirect('/registro')
      }
      else {
        const consultaPseudonimo = `
          SELECT *
          FROM autores
          WHERE pseudonimo = ${connection.escape(pseudonimo)}
        `
        connection.query(consultaPseudonimo, (error, filas, campos) => {
          if (filas.length > 0) {
            req.flash('mensaje', 'Pseudonimo duplicado')
            res.redirect('/registro')
          }
          else {
            const consulta = `
                                INSERT INTO
                                autores
                                (email, contrasena, pseudonimo)
                                VALUES (
                                  ${connection.escape(email)},
                                  ${connection.escape(contrasena)},
                                  ${connection.escape(pseudonimo)}
                                )
                              `
            connection.query(consulta, (error, filas, campos) => {
              req.flash('mensaje', 'Usuario registrado')
              res.redirect('/registro')
            })
          }
        })
      }
    })
    connection.release()
  })
})

router.get('/inicio', (req, res) => {
  res.render('inicio', { mensaje: req.flash('mensaje') })
})

router.post('/procesar_inicio', (req, res) => {
  pool.getConnection((err, connection) => {
    const consulta = `
      SELECT *
      FROM autores
      WHERE
      email = ${connection.escape(req.body.email)} AND
      contrasena = ${connection.escape(req.body.contrasena)}
    `
    connection.query(consulta, (error, filas, campos) => {
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

router.get('/publicacion/:id', (req, res) => {
  pool.getConnection((err, connection) => {
    const consulta = `
      SELECT *
      FROM publicaciones
      WHERE id = ${connection.escape(req.params.id)}
    `
    connection.query(consulta, (error, filas, campos) => {
      if (filas.length > 0) {
        res.render('publicacion', { publicacion: filas[0] })
      }
      else {
        res.redirect('/')
      }
    })
    connection.release()
  })
})


module.exports = router