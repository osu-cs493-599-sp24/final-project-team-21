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

router.patch('/:assignmentId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
        const assignment = await Assignment.update(req.body, {
            where: {
                id: assignmentId
            }
        })

        if (assignment[0] > 0) {
            res.status(204).send()
        } else {
            next()
        }
    } catch (e) {
        next(e)
    }
})

router.delete('/:assignmentId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
        const result = await Assignment.destroy({
            where: {
                id: assignmentId
            }
        })

        if (result) {
            res.status(204).send()
        } else {
            next()
        }
    } catch (e) {
        next(e)
    }
})


module.exports = router