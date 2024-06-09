const { Router } = require('express')
const { ValidationError } = require('sequelize')
const { Submission, SubmissionClientFields } = require('../models/submission')
const { Course } = require('../models/course')
const { Assignment } = require('../models/assignment')
const { requireAuthentication } = require('../lib/auth')

const router = Router()

/*
 * Route to update data for a specific submission
*/
router.patch('/:submissionId', requireAuthentication, async function (req, res, next) {
    const submissionId = req.params.submissionId
    try {
        const assignmentId = req.body.assignmentId
        if (assignmentId !== req.params.assignmentId) {
            res.status(400).send({
                error: "assignmentId field of the request body must match assignmentId parameter of the URL"
            })
            return
        }

        const assignment = await Assignment.findByPk(submissionId, {
            include: Course
        })

        if (!assignment) {
            next()
            return
        }

        const course = assignment.course

        // Only allows patching if the authenticated user is the instructor of the course, or an Admin
        if (course && course.instructorId == req.user || req.admin) {
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
        } else {
            res.status(403).send({
                error: "Not authorized to update the requested submission"
            })
        }
    } catch (e) {
        next(e)
    }
})

module.exports = router