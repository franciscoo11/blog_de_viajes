const express = require('express')
const router = express.Router()
const mysql = require('mysql')
var path = require('path')

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
      publicaciones.id id, titulo, resumen, fecha_hora, pseudonimo, votos, avatar
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
  res.render('registro', { mensaje: req.flash('mensaje') })
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
              if (req.files && req.files.avatar){
                const fileAvatar = req.files.avatar
                const id = filas.insertId
                const nameFile = `${id}${path.extname(fileAvatar.name)}`
                
                fileAvatar.mv(`./public/avatars/${nameFile)`, (error) => {
                  
                  const consultaAvatar = ` UPDATE autores SET avatar = ${connection.escape(nameFile)} WHERE id = ${connection.escape(id)}`
                  connection.query(consultaAvatar, (error, filas, campos) {
                    req.flash('mensaje', 'Usuario registrado con avatar')
                    res.redirect('/registro')
                  })
                })
              }
              else {
                req.flash('mensaje', 'Usuario registrado')
                res.redirect('/registro')
              }
              
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


router.get('/autores', (req, res) => {
  pool.getConnection((err, connection) => {
    const consulta = `
      SELECT autores.id id, pseudonimo, avatar, publicaciones.id publicacion_id, titulo
      FROM autores
      INNER JOIN
      publicaciones
      ON
      autores.id = publicaciones.autor_id
      ORDER BY autores.id DESC, publicaciones.fecha_hora DESC
    `
    connection.query(consulta, (error, filas, campos) => {
      autores = []
      ultimoAutorId = undefined
      filas.forEach(registro => {
        if (registro.id != ultimoAutorId){
          ultimoAutorId = registro.id
          autores.push({
            id: registro.id,
            pseudonimo: registro.pseudonimo,
            avatar: registro.avatar,
            publicaciones: []
          })
        }
        autores[autores.length-1].publicaciones.push({
          id: registro.publicacion_id,
          titulo: registro.titulo
        })
      });
      res.render('autores', { autores: autores })
    })


    connection.release()
  })
})

router.get('/publicacion/:id/votar', (req,res) {
  pool.getConnection((error,connection) => {
    const consulta = ` 
        SELECT * 
        FROM publicaciones 
        WHERE id = ${connection.escape(req.params.id)} 
    `
    connection.query(consulta, (error,filas,campos) => {
      if (filas.length > 0) {
        const consultaVoto = ` 
        UPDATE publicaciones 
        SET votos = votos + 1 
        WHERE id = ${connection.escape(req.params.id)} 
      `
      connection.query(consultaVoto, (error,filas,campos) => {
        res.redirect(`/publicacion/${req.params.id}`)
      })
      }
      else {
        req.flash('mensaje', 'Publicación invalida')
        res.redirect('/')
      }
    })
    connection.release()
  })
})

module.exports = router
