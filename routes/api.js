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
                    mensaje: "error al buscar la informacion solicitada"
                }})
                return
            }
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
            if (error){
                res.status(500)
                res.send({ error: {
                    codigo: error.code, 
                    mensaje: "error al buscar la informacion solicitada"
                }})
                return
            }
            if (filas.length > 0) {
                res.status(200)
                res.json({ data: filas[0] })
            }
            res.status(404)
            res.send({ error: {
                codigo: "NOT_FOUND", 
                mensaje: "No se encontro una publicacion con el id proporcionado"
            }})
        })
        connection.release()
    })
})

router.get('/api/v1/autores', function (req, res) {
    pool.getConnection(function (err, connection) {
        const query = ` SELECT * FROM autores `
        connection.query(query, function (error, filas, campos) {
            if (error){
                res.status(500)
                res.send({ error: {
                    codigo: error.code, 
                    mensaje: "error al buscar la informacion solicitada"
                }})
                return
            }
            if (filas.length > 0) {
                res.status(200)
                res.json({ data: filas })
            }
            else {
                res.status(404)
                res.send({errors: ["No se encontraron autores"]})
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
            if (error){
                res.status(500)
                res.send({ error: {
                    codigo: error.code, 
                    mensaje: "error al buscar la informacion solicitada"
                }})
                return
            }
            if (filas.length > 0) {
                res.status(200)
                res.json({ data: filas })
            }
            res.status(407)
            res.send({errors: ["El autor no existe."] })
        })
        connection.release()
    })
})

router.post('/api/v1/autores', function (req, res) {
    pool.getConnection(function (err, connection) {
        const email = req.body.email.toLowerCase().trim()
        const pseudonimo = req.body.pseudonimo.toLowerCase().trim()
        const contrasena = req.body.contrasena
        const consultaEmail = `
            SELECT *
            FROM autores
            WHERE email = ${connection.escape(email)}
        `
        connection.query(consultaEmail, (error, filas, campos) => {
            if (error){
                res.status(500)
                res.send({ error: {
                    codigo: error.code, 
                    mensaje: "error al buscar la informacion solicitada"
                }})
                return
            }
            if (filas.length > 0) {
                res.status(406)
                res.send({ errors: ['El email ya se encuentran registrados.'] })
            }
            const consultaPseudonimo = `
                SELECT *
                FROM autores
                WHERE pseudonimo = ${connection.escape(pseudonimo)}
            `
            connection.query(consultaPseudonimo, (error, filas, campos) => {
                if (error){
                    res.status(500)
                    res.send({ error: {
                        codigo: error.code, 
                        mensaje: "error al buscar la informacion solicitada"
                    }})
                    return
                }
                if (filas.length > 0) {
                    res.status(404)
                    res.send({ errors: ['El pseoudonimo ya se encuentran registrados.'] })
                }
                const query = `
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
                            mensaje: "error al insertar la informacion."
                        }})
                        return
                    }
                    if (filas && filas.affectedRows > 0){
                        res.status(201)
                        res.json({ data: filas[0] })
                    }
                    else{
                        res.status(403)
                        res.send({ errors: {
                            mensaje: "error verifica la informacion enviada en el cuerpo."
                        }})
                    }
                })
                connection.release()  
            })    
        })
    
    })
})

router.post('/api/v1/publicaciones', function (req, res) {
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
                    mensaje: "error al buscar la informacion."
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
                            mensaje: "error al insertar la informacion."
                        }})
                        return
                    }
                    if (filas && filas.affectedRows > 0){
                        res.status(201)
                        res.json({data: {
                            titulo: titulo,
                            resumen: resumen,
                            contenido: contenido,
                            id_autor: id_autor
                        }})
                    }
                    else {
                        res.status(403)
                        res.send({ errors: {
                        mensaje: "error verifica la informacion enviada en el cuerpo."
                        }})
                    }
                })
            }
            else{
                res.status(417)
                res.send({ errors: {
                    mensaje: "Las credenciales no son validas."
                }})
            }
        })
        connection.release()
    })   
})

router.delete('/api/v1/publicaciones/:id', function (req,res){
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
                    mensaje: "error al buscar la informacion."
                }})
                return
            }
            if (filas.length > 0){
                autor_id = filas[0].id
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
                            mensaje: "error al buscar la informacion."
                        }})
                        return
                    }
                    if (filas && filas.affectedRows > 0){
                        res.status(200)
                        res.json({data : ["Publicacion eliminada"]})
                    }
                    else {
                        res.status(401)
                        res.json({errors: ["La publicacion no fue eliminada."]})
                    }
                })
            }
        })
        connection.release()
    })

})

module.exports = router