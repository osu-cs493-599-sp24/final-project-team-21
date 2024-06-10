const { Router } = require("express")
const { ValidationError } = require("sequelize")

const { Course, CourseClientFields } = require("../models/course")
const { User } = require('../models/user')
const { Assignment } = require('../models/assignment')
const { requireAuthentication } = require("../lib/auth")
const { getChannel, queueName } = require("../lib/rabbitmq")
const { generateFilename } = require("../lib/multer")
const fs = require('fs')

const router = Router()

/*
 * Course routes
*/

// Create a new course
router.post("/", requireAuthentication, async (req, res) => {
  try {
    if (req.admin) {
      const course = await Course.create(req.body, CourseClientFields)
      res.status(201).send({ id: course.id })
    } else {
      res.status(403).send({
        error: "Not authorized to create a course"
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

// Fetch a list of all courses
router.get("/", async (req, res, next) => {
  // Queries: page, subject, course number, term
  let page = parseInt(req.query.page) || 1
  const subject = req.query.subject
  const number = req.query.number // Course number
  const term = req.query.term
  console.log("-- ", req.query)
  /*
   * Compute page number based on optional query string parameter `page`.
   * Make sure page is within allowed bounds.
   */
  page = page < 1 ? 1 : page
  const numPerPage = 10
  const offset = (page - 1) * numPerPage

  try {
    const result = await Course.findAndCountAll({
      limit: numPerPage,
      offset: offset,
      where: {
        ...(subject && { subject: subject }),
        ...(number && { number: number }),
        ...(term && { term: term })
      }
    })

    /*
     * Generate HATEOAS links for surrounding pages.
     */
    const lastPage = Math.ceil(result.count / numPerPage)
    const links = {}
    if (page < lastPage) {
      links.nextPage = `/courses?page=${page + 1}`
      links.lastPage = `/courses?page=${lastPage}`
    }
    if (page > 1) {
      links.prevPage = `/courses?page=${page - 1}`
      links.firstPage = "/courses?page=1"
    }

    /*
     * Append original query string to each HATEOAS link.
     */
    const queryString = Object.keys(req.query)
      .map((key) => key + "=" + req.query[key])
      .join("&") // Add "&query=value" for each query parameter
    if (queryString) {
      for (let key in links) { // Append query string to each link
        links[key] += `&${queryString}`
      }
    }

    /*
     * Construct and send response.
     */
    res.status(200).send({
      courses: result.rows,
      pageNumber: page,
      totalPages: lastPage,
      pageSize: numPerPage,
      totalCount: result.count,
      links: links
    })
  } catch (e) {
    next(e)
  }
})

// Fetch a specific course
router.get("/:courseId", async (req, res, next) => {
  const courseId = req.params.courseId
  try {
    const course = await Course.findByPk(courseId)
    if (course) {
      res.status(200).send(course)
    } else {
      next()
    }
  } catch (e) {
    next(e)
  }
})

// Update data for a specific course
router.patch("/:courseId", requireAuthentication, async (req, res, next) => {
  const courseId = parseInt(req.params.courseId)
  try {
    const course = await Course.findByPk(courseId)
    if ((course && course.instructorId === req.user) || req.admin) {
      const result = await Course.update(req.body, {
        where: { id: courseId },
        fields: CourseClientFields
      })
      if (result[0] > 0) {
        res.status(200).send()
      } else {
        next()
      }
    } else {
      res.status(403).send({
        error: "Not authorized to update the requested course"
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

// Removes a course
router.delete("/:courseId", requireAuthentication, async (req, res, next) => {
  const courseId = parseInt(req.params.courseId)
  try {
    if (req.admin) {
      const result = await Course.destroy({ where: { id: courseId } })
      if (result > 0) {
        res.status(204).send()
      } else {
        next()
      }
    } else {
      res.status(403).send({
        error: "Not authorized to delete a course"
      })
    }
  } catch (e) {
    next(e)
  }
})

// Get student roster for a course
router.get('/:courseId/students', requireAuthentication, async function (req, res, next) {
  const courseId = parseInt(req.params.courseId)
  try {
    const course = await Course.findByPk(courseId)
    if ((course && course.instructorId === req.user) || req.admin) {
      const result = await Course.findByPk(courseId, {
        include: {
          model: User,
          where: { role: "student" }
        }
      })
      if (result) {
        const students = result.Users
        res.status(200).send({ students: students })
      } else {
        next()
      }
    } else {
      res.status(403).send({
        error: "Not authorized to view enrolled students"
      })
    }
  } catch (e) {
    next(e)
  }
})

// Update enrollment for a course
router.post("/:courseId/students", requireAuthentication, async function (req, res, next) {
  const courseId = parseInt(req.params.courseId)
  try {
    const course = await Course.findByPk(courseId)
    if ((course && course.instructorId === req.user) || req.admin) {
      if (req && req.body.add && req.body.remove) {
        // Generate offline work
        const channel = getChannel()
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify({
          id: courseId,
          add: req.body.add,
          remove: req.body.remove
        })))
        res.status(202).send()
      } else {
        res.status(400).send({
          error: "Invalid request body"
        })
      }
    } else {
      res.status(403).send({
        error: "Not authorized to update course enrollment"
      })
    } 
  } catch (e) {
    next(e)
  }
})

// Fetch a CSV file listing the students enrolled in a course
router.get("/:courseId/roster", requireAuthentication, async function (req, res, next) {
  const courseId = parseInt(req.params.courseId)
  try {
    const course = await Course.findByPk(courseId)
    if ((course && course.instructorId === req.user) || req.admin) {
      if (course) {
        const filename = `${generateFilename(courseId)}.csv`
        const filePath = path.join(__dirname, "../lib/rosters", filename)
        if (fs.existsSync(filePath)) {
          res.download(filePath)
        } else {
          res.status(404).send({
            error: "Course exists but roster does not exist"
          })
        }
        res.download(filePath)
      } else {
        next()
      }      
    } else {
      res.status(403).send({
        error: "Not authorized to download the course roster"
      })
    }
  } catch (e) {
    next(e)
  }
})

// Fetch the list of assignments for a course
router.get("/:courseId/assignments", async function (req, res, next) {
  const courseId = req.params.courseId
  try {
    const course = await Course.findByPk(courseId)
    if (course) {
      const assignments = await Assignment.findAll({
        where: { courseId: courseId },
      })
      res.status(200).send({ assignments: assignments })
    } else {
      next()
    }
  } catch (e) {
    next(e)
  }
})

module.exports = router
