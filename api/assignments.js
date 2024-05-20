const { Router } = require('express')

const { Assignment } = require('../models/assignment')

const router = Router()

/*
 * Routes below.
 */
router.post('/', async (req, res) => {
    try {
        console.log(req.body)
        const assignment = await Assignment.create(req.body)
        res.status(201).send(assignment)
    } catch (e) {
        console.log("error", e)
        next(e)
    }
})


module.exports = router