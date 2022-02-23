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

router.get('/api/v1/publicaciones', function (req, res) {
    pool.getConnection(function (err, connection) {
        let query
        const busqueda_api = ( req.query.busqueda ) ? req.query.busqueda : ""
        if (busqueda_api == ""){
            query = ` SELECT * FROM publicaciones `
        }
        else {
            query = ` 
            SELECT * FROM publicaciones WHERE
            titulo LIKE '%${busqueda_api}%' OR
            resumen LIKE '%${busqueda_api}%' OR
            contenido LIKE '%${busqueda_api}%'
            ORDER BY fecha_hora DESC
            `
        }
        connection.query(query, function (error, filas, campos) {
           if (filas.length > 0) {
                res.status(200)
                res.json({ data: filas })
            }
            else {
                res.status(404)
                res.send({ errors: [] })
            }
        })
        connection.release()
    })
})


router.get('/api/v1/publicaciones/:id', function (req, res) {
    pool.getConnection(function (err, connection) {
        const query = ` SELECT * FROM publicaciones WHERE id = ${connection.escape(req.params.id)} `
        connection.query(query, function (error, filas, campos) {
            if (filas.length > 0) {
                res.status(200)
                res.json({ data: filas[0] })
            }
            else {
                res.status(404)
                res.send({ errors: [] })
            }
        })
        connection.release()
    })
})

router.get('/api/v1/autores', function (req, res) {
    pool.getConnection(function (err, connection) {
        const query = ` SELECT * FROM autores `
        connection.query(query, function (error, filas, campos) {
            if (filas.length > 0) {
                res.status(200)
                res.json({ data: filas })
            }
            else {
                res.status(404)
                res.send({errors: []})
            }
        })
        connection.release()
    })
})

router.get('/api/v1/autores/:id', function (req, res) {
    pool.getConnection(function (err, connection) {
        const query = ` 
        SELECT
        publicaciones.id id, titulo, resumen, fecha_hora, pseudonimo, votos, avatar
        FROM publicaciones
        INNER JOIN autores
        ON publicaciones.autor_id = autores.id
        WHERE autor_id = ${connection.escape(req.params.id)} 
        `
        connection.query(query, function (error, filas, campos) {
            if (filas.length > 0) {
                res.status(200)
                res.json({ data: filas })
            }
            else {
                res.status(404)
                res.send({errors: ["El id ingresado no existe."] })
            }
        })
        connection.release()
    })
})

router.post('/api/v1/autores', function (req, res) {
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
                res.send({ errors: ['El email o el pseoudonimo ya se encuentran registrados.'] })
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
                        (${connection.escape(pseudonimo)},${connection.escape(email)},${connection.escape(contrasena)})
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

router.post('/api/v1/publicaciones', function (req, res) {
    pool.getConnection(function (err, connection) {
        const email = req.query.email.toLowerCase().trim()
        const contrasena = req.query.contrasena.trim()
        const titulo = req.body.titulo
        const resumen = req.body.resumen
        const contenido = req.body.contenido
        if (email && contrasena != "") {
            const query = `
            SELECT *
            FROM autores
            WHERE email = ${connection.escape(email)} AND contrasena = ${connection.escape(contrasena)}
            `
            connection.query(query, (error,filas,campos) => {
                if (filas.length > 0) {
                    const insertConsulta = `
                    INSERT INTO
                    publicaciones
                    (titulo,resumen,contenido)
                    VALUES
                    (
                        ${connection.escape(titulo)},
                        ${connection.escape(resumen)},
                        ${connection.escape(contenido)}
                    )
                    `
                    connection.query(insertConsulta, (error,filas,campos) => {
                        const nuevoId = filas.insertId
                        const queryConsulta = ` SELECT * FROM publicaciones WHERE id = ${connection.escape(nuevoId)} `

                        if (!error){
                            res.status(201)
                            res.json({data : filas[0]})
                        }

                        else {
                            res.status(404)
                            res.send({errors: ["No se pudo agregar la publicacion."]})
                        }
                            
                        

                    })
                }
                else {
                    res.status(401)
                    res.send({errors: ["El email y la contraseña no coinciden."]})
                }
            
            
            
            })
    
        }    
        
    
    
    
    
    })   
})


module.exports = router