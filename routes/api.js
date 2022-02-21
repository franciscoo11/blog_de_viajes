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

router.get('api/v1/publicaciones?busqueda', function (req, res) {
    pool.getConnection(function (err, connection) {
        const query = ` 
            SELECT * FROM publicaciones WHERE
            titulo LIKE '%${req.query.busqueda}%' OR
            resumen LIKE '%${req.query.busqueda}%' OR
            contenido LIKE '%${req.query.busqueda}%'
        `
        connection.query(query, function (error, filas, campos) {
            res.status(200)
            res.json({ data: filas })
        })
        connection.release()
    })
})

router.get('api/v1/publicaciones', function (req, res) {
    pool.getConnection(function (err, connection) {
        const query = ` SELECT * FROM publicaciones `
        connection.query(query, function (error, filas, campos) {
            res.status(200)
            res.json({ data: filas })
        })
        connection.release()
    })
})

router.get('api/v1/publicaciones/:id', function (req, res) {
    pool.getConnection(function (err, connection) {
        const query = ` SELECT * FROM publicaciones WHERE id = ${connection.escape(req.params.id)} `
        connection.query(query, function (error, filas, campos) {
            if (filas.length > 0) {
                res.status(200)
                res.json({ data: filas[0] })
            }
            else {
                res.status(404)
                res.send({ errors: "No se encuentra esta publicacion." })
            }
        })
        connection.release()
    })
})

router.get('api/v1/autores', function (req, res) {
    pool.getConnection(function (err, connection) {
        const query = ` SELECT * FROM autores `
        connection.query(query, function (error, filas, campos) {
            res.status(200)
            res.json({ data: filas })
        })
        connection.release()
    })
})

router.get('api/v1/autores/:id', function (req, res) {
    pool.getConnection(function (err, connection) {
        const query = ` 
        SELECT autores.id id, pseudonimo, avatar, publicaciones.id publicacion_id, titulo, resumen, contenido, votos
        FROM autores
        INNER JOIN
        publicaciones
        ON publicaciones.autor_id = autores.id
        WHERE id = ${connection.escape(req.params.id)} 
        `
        connection.query(query, function (error, filas, campos) {
            if (filas.length > 0) {
                res.status(200)
                res.json({ data: filas[0] })
            }
            else {
                res.status(404)
                res.send({ errors: "No se encuentra el autor." })
            }
        })
        connection.release()
    })
})

router.post('/api/v1/autores', function (req, res) {
    pool.getConnection(function (err, connection) {
        const query = `
        INSERT 
        INTO autores 
        (pseudonimo, email, contrasena) 
        VALUES
        (${connection.escape(req.body.pseudonimo)},${connection.escape(req.body.email)},${connection.escape(req.body.contrasena)}
        `
        connection.query(query, function (error, filas, campos) {
            const nuevoId = filas.insertId
            const queryConsulta = ` SELECT * FROM autores WHERE id = ${connection.escape(nuevoId)} `

            connection.query(queryConsulta, function (error, filas, columnas) {
                res.status(201)
                res.json({ data: filas[0] })
            })



        })
        connection.release()

    })

})

module.exports = router