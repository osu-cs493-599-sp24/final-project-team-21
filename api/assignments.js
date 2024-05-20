const { Router } = require('express')

const { Assignment } = require('../models/assignment')

const router = Router()

/*
 * Routes below.
 */
router.post('/', async (req, res, next) => {
    try {
        console.log(req.body)
        const assignment = await Assignment.create(req.body)
        res.status(201).send(assignment)
    } catch (e) {
        next(e)
    }
})

router.get('/:assignmentId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
        const assignment = await Assignment.findByPk(assignmentId)
        if (assignment) {
            res.status(200).send(assignment)
        } else {
            next()
        }
    } catch (e) {
        next(e)
    }
})


module.exports = router