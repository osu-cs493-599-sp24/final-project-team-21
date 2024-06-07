const { Router } = require('express')
const { ValidationError, Sequelize } = require('sequelize')

const { User, UserClientFields } = require('../models/user')
const { Course } = require('../models/course')
const { getUserById, requireAuthentication, validateCredentials, generateAuthToken, checkAdminAuthorization } = require('../lib/auth')


const router = Router()

/*
 * Routes below.
 */
router.post("/", /*checkAdminAuthorization,*/ async (req, res, next) => {
    try {
        // // Prevent client creating an "admin" or "instructor" user without "admin" authorization
        // if (!req.admin && (req.body.role === "admin" || req.body.role === "instructor")) {
        //     res.status(403).send({
        //         error: "Not authorized to create a user with the requested role"
        //     })
        //     return
        // }

        const user = await User.create(req.body, UserClientFields)
        res.status(201).send({ id: user.id })
    } catch (e) {
        if (e instanceof ValidationError) {
            res.status(400).send({ error: e.message })
        } else {
            next(e)
        }
    }
})

router.post("/login", async (req, res, next) => {
    if (req.body && req.body.email && req.body.password) {
        try {
            const userId = await validateCredentials(req.body.email, req.body.password)
            if (userId) {
                const token = generateAuthToken(userId)
                res.status(200).send({
                    token
                })
            } else {
                res.status(401).send({
                    error: "Invalid credentials"
                })
            }
        } catch (e) {
            next(e)
        }
    } else {
        res.status(400).send({
            error: "Request must have a JSON body with email and password fields"
        })
    }
})

router.get("/:userId", requireAuthentication, async (req, res, next) => {
    const userId = parseInt(req.params.userId)

    if (req.user === userId || req.admin) {
        try {
            const user = await User.findByPk(userId, {
                attributes: {
                    exclude: ["password"]
                },
                include: Course
            })
            if (user) {
                res.status(200).send(user)
            } else {
                next()
            }
        } catch (e) {
            next(e)
        }
    } else {
        res.status(403).send({
            error: "Not authorized to access the specified resource"
        })
    }
})

module.exports = router