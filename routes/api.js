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

router.get('api/v1/publicaciones', function (req, res) {
    pool.getConnection(function (err, connection) {
        const busqueda_api = ( req.query.busqueda ) ? req.query.busqueda : ""
        if (busqueda_api != ""){
            const query = ` 
            SELECT * FROM publicaciones WHERE
            titulo LIKE '%${busqueda_api}%' OR
            resumen LIKE '%${busqueda_api}%' OR
            contenido LIKE '%${busqueda_api}%'
            ORDER BY fecha_hora DESC
            `
        }
        connection.query(query, function (error, filas, campos) {
           if (!error) {
                res.status(200)
                res.json({ data: filas })
            }
            else {
                res.status(404)
                res.send({errors: 'No se encontraron resultados de la busqueda.'})
            }
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

router.post('/api/v1/autores/', function (req, res) {
    pool.getConnection(function (err, connection) {
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
                res.status(400)
                res.send({ errors: 'El email o el pseoudonimo ya se encuentran registrados.' })
            }
            else {
                const consultaPseudonimo = `
                    SELECT *
                    FROM autores
                    WHERE pseudonimo = ${connection.escape(pseudonimo)}
                `
                connection.query(consultaPseudonimo, (error, filas, campos) => {
                    if (filas.length > 0) {
                        res.status(400)
                        res.send({ errors: 'El email o el pseoudonimo ya se encuentran registrados.' })
                    }
                    else {
                        const query = `
                        INSERT 
                        INTO autores 
                        (pseudonimo, email, contrasena) 
                        VALUES
                        (${connection.escape(email)},${connection.escape(pseudonimo)},${connection.escape(contrasena)}
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
                    }

                 
                 
                })    
            }

        })
        

    })
})

module.exports = router