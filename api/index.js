const { Router } = require('express')


const assignmentsRouter = require('./assignments')
const coursesRouter = require('./courses')
const submissionsRouter = require('./submissions')
const usersRouter = require('./users')

const router = Router()

router.use('/assignments', assignmentsRouter)
router.use('/courses', coursesRouter)
router.use('/submissions', submissionsRouter)
router.use('/users', usersRouter)


module.exports = router