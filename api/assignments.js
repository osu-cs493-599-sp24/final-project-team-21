const { Router } = require('express')
const { ValidationError } = require('sequelize')
const { Assignment, AssignmentClientFields } = require('../models/assignment')
const { Submission, SubmissionClientFields } = require('../models/submission')
const { upload } = require('../lib/multer')

const router = Router()

/*
 * Route to create a new assignment
 */
router.post('/', async (req, res, next) => {
    try {
        console.log(req.body)
        const assignment = await Assignment.create(req.body, AssignmentClientFields)
        res.status(201).send(assignment)
    } catch (e) {
        if (e instanceof ValidationError) {
          res.status(400).send({ error: e.message })
        } else {
          next(e)
        }
    }
})

/*
 * Route to fetch info about a specific assignment
 */
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

/*
 * Route to update data for a assignment
 */
router.patch('/:assignmentId', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
        const assignment = await Assignment.update(req.body, {
            where: {
                id: assignmentId
            },
            fields: AssignmentClientFields
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

/*
 * Route to delete a assignment
 */
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

/*
 * Route to fetch all submissions for a given assignment
 */
router.get('/:assignmentId/submissions', async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
        const submissions = await Submission.findAll({
            where: {
                assignmentId: assignmentId
            }
        })
        res.status(200).send(submissions)
    } catch (e) {
        next(e)
    }
})

/*
 * Route to create a new submission for an assignment
 */
router.post(
    '/:assignmentId/submissions', 
    upload.single('file'),
    async function (req, res, next) {
        console.log("== req.file:", req.file)
        console.log("== req.body:", req.body)
    if (req.file) {
        const filepath = `/media/submissions/${req.file.filename}` 
        const submission = await Submission.create({...req.body, file: filepath}, SubmissionClientFields)
        
        res.status(201).send({
            id: submission.id,
        })
    } else {
        res.status(400).send({
            error: "Invalid file type"
        })
    }
})


module.exports = router