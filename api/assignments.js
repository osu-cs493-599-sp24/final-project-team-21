const { Router } = require('express')
const { ValidationError } = require('sequelize')
const { Assignment, AssignmentClientFields } = require('../models/assignment')
const { Submission, SubmissionClientFields } = require('../models/submission')
const { upload } = require('../lib/multer')
const { requireAuthentication } = require('../lib/auth')
const { Course } = require('../models/course')

const router = Router()

/*
 * Route to create a new assignment
 */
router.post('/', requireAuthentication, async (req, res, next) => {
    try {
        const courseId = req.body.courseId
        const course = await Course.findByPk(courseId)

        // Only allows creation if the authenticated user is the instructor of the course, or an Admin
        if (course && course.instructorId == req.user || req.admin) {
            const assignment = await Assignment.create(req.body, AssignmentClientFields)
            res.status(201).send(assignment)
        } else {
            res.status(403).send({
                error: "Not authorized to create an assignment for the requested course"
            })
        }
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
router.patch('/:assignmentId', requireAuthentication, async function (req, res, next) {
    const assignmentId = req.params.assignmentId
    try {
        const courseId = req.body.courseId
        const course = await Course.findByPk(courseId)

        // Only allows patching if the authenticated user is the instructor of the course, or an Admin
        if (course && course.instructorId == req.user || req.admin) {
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
        } else {
            res.status(403).send({
                error: "Not authorized to update an assignment for the requested course"
            })
        }
    } catch (e) {
        next(e)
    }
})

/*
 * Route to delete a assignment
 */
router.delete('/:assignmentId', requireAuthentication, async function (req, res, next) {
    const assignmentId = req.params.assignmentId

    try {
        const assignment = await Assignment.findByPk(assignmentId,
            { include: Course }
        )
        const course = assignment.course
    
        if (course && course.instructorId == req.user || req.admin) {
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
        } else {
            res.status(403).send({
                error: "Not authorized to delete an assignment for the requested course"
            })
        }
    } catch (e) {
        next(e)
    }
})

/*
 * Route to fetch all submissions for a given assignment
 */
router.get('/:assignmentId/submissions', requireAuthentication, async function (req, res, next) {
    /*
    * Compute page number based on optional query string parameter `page`.
    * Make sure page is within allowed bounds.
    */
    let page = parseInt(req.query.page) || 1;
    page = page < 1 ? 1 : page;
    const numPerPage = 10;
    const offset = (page - 1) * numPerPage;

    const assignmentId = req.params.assignmentId
    const userId = req.query.userId;

    // Filters by userId if it exists, otherwise just filters by assignmentId
    const whereClause = userId ? { assignmentId, userId } : { assignmentId };

    try {
        // Only allows fetching if the authenticated user is the instructor of the course, or an Admin
        const assignment = await Assignment.findByPk(assignmentId,
            { include: Course }
        )
        const course = assignment.course
    
        if (course && course.instructorId == req.user || req.admin) {
            const submissions = await Submission.findAndCountAll({
                where: whereClause,
                limit: numPerPage,
                offset: offset
            })

            if (submissions.count === 0) {
                res.status(404).send({
                    error: "No submissions found using provided id"
                })
                return
            }

            /*
            * Generate HATEOAS links for surrounding pages.
            */
            const lastPage = Math.ceil(submissions.count / numPerPage);
            const links = {};
            if (page < lastPage) {
                links.nextPage = `/assignments/${assignmentId}/submissions?page=${page + 1}`;
                links.lastPage = `/assignments/${assignmentId}/submissions?page=${lastPage}`;
            }
            if (page > 1) {
                links.prevPage = `/assignments/${assignmentId}/submissions?page=${page - 1}`;
                links.firstPage = `/assignments/${assignmentId}/submissions?page=1`;
            }

            /*
            * Construct and send response.
            */
            res.status(200).send({
                submissions: submissions.rows,
                pageNumber: page,
                totalPages: lastPage,
                pageSize: numPerPage,
                totalCount: submissions.count,
                links: links,
            });
        } else {
            res.status(403).send({
                error: "Not authorized to fetch submissions for the requested course"
            })
        }
    } catch (e) {
        next(e)
    }
})

/*
 * Route to create a new submission for an assignment
 */
router.post(
    '/:assignmentId/submissions', 
    requireAuthentication,
    upload.single('file'),
    async function (req, res, next) {
        //console.log("== req.file:", req.file)
        //console.log("== req.body:", req.body)
        if (req.file) {
            const filepath = `/media/submissions/${req.file.filename}` 
            try {
                    const assignmentId = req.body.assignmentId
                    const assignment = await Assignment.findByPk(assignmentId,
                        { include: Course }
                    )
                    const course = assignment.course

                    // Only allows fetching if the authenticated user is the instructor of the course, or an Admin
                    if (course && course.instructorId == req.user || req.admin) {
                        // Destructuring to exclude grade field in creation
                        const { grade, ...otherFields } = req.body;
                        const submission = await Submission.create({...otherFields, file: filepath}, SubmissionClientFields)
                
                        res.status(201).send({
                            id: submission.id,
                        })
                    } else {
                        res.status(403).send({
                            error: "Not authorized to create a submission for the requested course"
                        })
                    }
            } catch (e) {
                if (e instanceof ValidationError) {
                    res.status(400).send({ error: e.message })
                } else {
                    next(e)
                }
            }
        } else {
            res.status(400).send({
                error: "Invalid file type"
            })
        }
})


module.exports = router