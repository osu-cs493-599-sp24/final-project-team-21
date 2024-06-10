const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

require('dotenv').config()
const secretKey = process.env.SERVER_AUTH_KEY || process.env.SECRET_KEY

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
    return jwt.sign(payload, secretKey, { expiresIn: '24h' })
}

exports.checkAdminAuthorization = async function (req, res, next) {
    if (!req.body || (req.body.role !== "admin" && req.body.role !== "instructor")) {
        next()
        return
    }

    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null

    try {
        const payload = jwt.verify(token, secretKey)
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
        const payload = jwt.verify(token, secretKey)
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

// This function is not middleware; it is used to check whether the requester is logged in or not
exports.checkAuthentication = function (req) {
    const authHeader = req.get("Authorization") || ""

    if (!authHeader) {
        return false
    }

    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null

    try {
        const payload = jwt.verify(token, secretKey)
        return true
    } catch (e) {
        return false
    }
}