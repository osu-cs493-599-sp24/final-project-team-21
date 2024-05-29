const { Router } = require('express')
const { ValidationError } = require('sequelize')
const { Submission, SubmissionClientFields } = require('../models/submission')

const router = Router()

/*
 * Route to update data for a specific submission
 TODO: Limit patching to an authenticated User with 'admin' role or an authenticated 'instructor' User 
 whose ID matches the instructorId of the associated course
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

        if (submission[0] > 0) {
            res.status(204).send()
        } else {
            next()
        }
    } catch (e) {
        next(e)
    }
})

module.exports = router