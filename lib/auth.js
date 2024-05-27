const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { User } = require('../models/user')

async function getUserById(userId, includePassword) {
    const options = {
        attributes: {
            exclude: includePassword ? [] : ["password"]
        }
    }

    return await User.findByPk(userId, options)
}
exports.getUserById = getUserById

async function getUserByEmail(userEmail, includePassword) {
    const options = {
        where: {
            email: userEmail
        },
        attributes: {
            exclude: includePassword ? [] : ["password"]
        }
    }

    return await User.findOne(options)
}

exports.validateCredentials = async function (email, password) {
    const user = await getUserByEmail(email, true)
    return (user && await bcrypt.compare(password, user.password)) ? user.id : null
}

exports.generateAuthToken = function (userId) {
    const payload = {
        sub: userId
    }
    return jwt.sign(payload, process.env.SERVER_AUTH_KEY, { expiresIn: '24h' })
}

exports.checkAdminAuthorization = async function (req, res, next) {
    if (!req.body || req.body.role !== "admin") {
        next()
        return
    }

    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null

    try {
        const payload = jwt.verify(token, process.env.SERVER_AUTH_KEY)
        req.user = payload.sub
        
        const user = await getUserById(payload.sub)
        req.admin = user.role === "admin"
        next()
    } catch (e) {
        res.status(401).send({
            error: "Valid authentication token required"
        })
    }
}

exports.requireAuthentication = async function (req, res, next) {
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null
    
    try {
        const payload = jwt.verify(token, process.env.SERVER_AUTH_KEY)
        req.user = payload.sub

        const user = await getUserById(payload.sub)
        req.admin = user.role === "admin"
        next()
    } catch (e) {
        res.status(401).send({
            error: "Valid authentication token required"
        })
    }
}