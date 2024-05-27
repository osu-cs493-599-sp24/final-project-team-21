const { Router } = require('express')
const { ValidationError } = require('sequelize')
const { Submission, SubmissionClientFields } = require('../models/submission')

const router = Router()

/*
 * Route to update data for a specific submission
*/
router.patch('/:submissionId', async function (req, res, next) {
    const submissionId = req.params.submissionId
    try {
        const submission = await Submission.update(req.body, {
            where: {
                id: submissionId
            },
            fields: SubmissionClientFields
        })

        if (submission) {
            res.status(204).send()
        } else {
            next()
        }
    } catch (e) {
        next(e)
    }
})

module.exports = router