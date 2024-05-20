const { Router } = require('express')
const { ValidationError } = require('sequelize')

const { Course } = require('../models/course')

const router = Router()

/*
 * Routes below.
 */
router.post('/', async (req, res) => {
    try {
        console.log(req.body)
        const course = await Course.create(req.body)
        res.status(201).send(course)
    } catch (e) {
        console.log("error", e)
        next(e)
    }
})

module.exports = router