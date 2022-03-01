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

router.get('/publicaciones', function (req, res) {
    pool.getConnection(function (err, connection) {
        let query
        const busqueda_api = ( req.query.busqueda ) ? connection.escape(req.query.busqueda) : ""
        query = `SELECT * FROM publicaciones`
        if (busqueda_api != ""){
            query = ` 
            SELECT * FROM publicaciones WHERE
            titulo LIKE '%${busqueda_api}%' OR
            resumen LIKE '%${busqueda_api}%' OR
            contenido LIKE '%${busqueda_api}%'
            ORDER BY fecha_hora DESC
            `
        }
        connection.query(query, function (error, filas, campos) {
            if (error){
                res.status(500)
                res.send({ error: {
                    codigo: error.code, 
                    mensaje: "Falló inesperado en el servidor."
                }})
                return
            }
            if (filas.length > 0) {
                res.status(200)
                res.json({ data: filas })
            }
            else {
                res.status(404)
                res.send({ error: {
                    codigo: "NOT_FOUND", 
                    mensaje: "No se encontro ninguna publicación."
                }})
            }
        })
        connection.release()
    })
})

router.get('/publicaciones/:id', function (req, res) {
    pool.getConnection(function (err, connection) {
        const query = ` 
        SELECT 
        * 
        FROM publicaciones 
        WHERE id = ${connection.escape(req.params.id)} 
        `
        connection.query(query, function (error, filas, campos) {
            if (error){
                res.status(500)
                res.send({ error: {
                    codigo: error.code, 
                    mensaje: "Falló inesperado en el servidor."
                }})
                return
            }
            if (filas.length > 0) {
                res.status(200)
                res.json({ data: filas[0] })
            }
            else{
                res.status(404)
                res.send({ error: {
                    codigo: "NOT_FOUND", 
                    mensaje: "No se encontro ninguna publicación."
                }})
            }
            
        })
        connection.release()
    })
})

router.get('/autores', function (req, res) {
    pool.getConnection(function (err, connection) {
        const query = ` SELECT * FROM autores `
        connection.query(query, function (error, filas, campos) {
            if (error){
                res.status(500)
                res.send({ error: {
                    codigo: error.code, 
                    mensaje: "Falló inesperado en el servidor."
                }})
                return
            }
            if (filas.length > 0) {
                res.status(200)
                res.json({ data: filas })
            }
            else {
                res.status(404)
                res.send({errors: {
                    codigo: "NOT_FOUND", 
                    mensaje: "No se encontro ningún autor."
                }})
            }
        })
        connection.release()
    })
})

router.get('/autores/:id', function (req, res) {
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
            if (error){
                res.status(500)
                res.send({ error: {
                    codigo: error.code, 
                    mensaje: "Falló inesperado en el servidor."
                }})
                return
            }
            if (filas.length > 0) {
                res.status(200)
                res.json({ data: filas })
            }
            else {
                res.status(404)
                res.send({errors: {
                    codigo: "NOT_FOUND", 
                    mensaje: "El autor ingresado no es válido o no posee publicaciones."
                }})
            }
        })
        connection.release()
    })
})

router.post('/autores', function (req, res) {
    pool.getConnection(function (err, connection) {
        const email = req.body.email.toLowerCase().trim()
        const pseudonimo = req.body.pseudonimo.toLowerCase().trim()
        const contrasena = req.body.contrasena
        let query
        query = `
            SELECT *
            FROM autores
            WHERE email = ${connection.escape(email)}
        `
        connection.query(query, (error, filas, campos) => {
            if (error){
                res.status(500)
                res.send({ error: {
                    codigo: error.code, 
                    mensaje: "Falló inesperado en el servidor."
                }})
                return
            }
            if (filas.length > 0) {
                res.status(422)
                res.send({ errors: ['El email ya se encuentra registrado.'] })
            }
            else {
                query = `
                SELECT *
                FROM autores
                WHERE pseudonimo = ${connection.escape(pseudonimo)}
                `
            }
            connection.query(query, (error, filas, campos) => {
                if (error){
                    res.status(500)
                    res.send({ error: {
                        codigo: error.code, 
                        mensaje: "Falló inesperado en el servidor."
                    }})
                    return
                }
                if (filas.length > 0) {
                    res.status(422)
                    res.send({ errors: ['El pseoudonimo ya se encuentra registrado.'] })
                    return
                }
                query = `
                    INSERT 
                    INTO autores 
                    (pseudonimo, email, contrasena) 
                    VALUES
                    (${connection.escape(pseudonimo)},${connection.escape(email)},${connection.escape(contrasena)})
                `
                connection.query(query, function (error, filas, campos) {
                    if (error){
                        res.status(500)
                        res.send({ error: {
                            codigo: error.code, 
                            mensaje: "Falló inesperado en el servidor."
                        }})
                        return
                    }
                    if (filas && filas.affectedRows > 0){
                        res.status(201)
                        res.json({ data: {
                            email: email, 
                            pseudonimo: pseudonimo,
                            contrasena: contrasena,
                        }})
                    }
                    else{
                        res.status(403)
                        res.send({ errors: {
                            codigo: "BODY_WRONG",
                            mensaje: "error verifica la información enviada en el cuerpo."
                        }})
                    }
                })
                connection.release()  
            })    
        })
    })
})

router.post('/publicaciones', function (req, res) {
    pool.getConnection(function (err, connection) {
        const email = req.query.email.toLowerCase().trim()
        const contrasena = req.query.contrasena
        const titulo = req.body.titulo
        const resumen = req.body.resumen
        const contenido = req.body.contenido
        const consulta = `
            SELECT *
            FROM autores
            WHERE 
            email = ${connection.escape(email)} AND 
            contrasena = ${connection.escape(contrasena)}
        `
        connection.query(consulta, (error,filas,campos) => {
            if (error){
                res.status(500)
                res.send({ error: {
                    codigo: error.code, 
                    mensaje: "Falló inesperado en el servidor."
                }})
                return
            }
            if (filas.length > 0){
                const id_autor = filas[0].id
                const insertConsulta = `
                    INSERT 
                    INTO publicaciones
                    (titulo, resumen, contenido, autor_id)
                    VALUES
                    (${connection.escape(titulo)},${connection.escape(resumen)},${connection.escape(contenido)}, ${connection.escape(id_autor)})
                `
                connection.query(insertConsulta, (error,filas,campos) => {
                    if (error){
                        res.status(500)
                        res.send({ error: {
                            codigo: error.code, 
                            mensaje: "Falló inesperado en el servidor."
                        }})
                        return
                    }
                    if (filas && filas.affectedRows > 0){
                        const idPublicacion = filas.insertId
                        res.status(201)
                        res.json({data: {
                            titulo: titulo,
                            resumen: resumen,
                            contenido: contenido,
                            id : idPublicacion
                        }})
                    }
                    else {
                        res.status(403)
                        res.send({ errors: {
                        mensaje: "error verifica la información enviada en el cuerpo."
                        }})
                    }
                })
            }
            else{
                res.status(401)
                res.send({ errors: {
                    mensaje: "No esta autorizado para realizar la operación."
                }})
            }
        })
        connection.release()
    })
})   

router.delete('/publicaciones/:id', function (req,res){
    pool.getConnection(function (err,connection){
        const email = req.query.email.toLowerCase().trim()
        const contrasena = req.query.contrasena
        const id = req.params.id
        const consulta = `
            SELECT
            *
            FROM autores
            WHERE
            email = ${connection.escape(email)} AND 
            contrasena = ${connection.escape(contrasena)}
        `
        connection.query(consulta, (error,filas,campos) => {
            if (error){
                res.status(500)
                res.send({ error: {
                    codigo: error.code, 
                    mensaje: "Falló inesperado en el servidor."
                }})
                return
            }
            if (filas.length > 0){
                const autor_id = filas[0].id
                const query = ` 
                    DELETE 
                    FROM 
                    publicaciones 
                    WHERE
                    id = ${connection.escape(id)} 
                    AND 
                    autor_id = ${connection.escape(autor_id)}
                `
                connection.query(query, (error,filas,columnas) => {
                    if (error){
                        res.status(500)
                        res.send({ error: {
                            codigo: error.code, 
                            mensaje: "Falló inesperado en el servidor."
                        }})
                        return
                    }
                    if (filas && filas.affectedRows > 0){
                        res.status(200)
                        res.json({data : ["Publicación eliminada"]})
                    }
                    else {
                        res.status(401)
                        res.json({errors: ["El id ingresado no corresponde. Por lo tanto no se realizo la acción."]})
                    }
                })
            }
        })
        connection.release()
    })
})

module.exports = router
