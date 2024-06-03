const { Router } = require("express");
const { ValidationError } = require("sequelize");

const { Course, CourseClientFields } = require("../models/course");
const { User } = require('../models/user')

const router = Router();

/*
 * Routes below.
 */

// Create a new course
// TODO: Add auth, only admin can create new courses
router.post("/", async (req, res) => {
  try {
    console.log("-- ", req.body);
    // TODO: Data validation for request body, maybe this is not needed
    const course = await Course.create(req.body, CourseClientFields);
    res.status(201).send({ id: course.id });
  } catch (e) {
    if (e instanceof ValidationError) {
      res.status(400).send({ error: e.message })
    } else {
      next(e);
    }
    // TODO: Handle response code and message for failed auth
  }
});

// Fetch a list of all courses
router.get("/", async (req, res, next) => {
  /*
   * Compute page number based on optional query string parameter `page`.
   * Make sure page is within allowed bounds.
   */
  let page = parseInt(req.query.page) || 1;
  page = page < 1 ? 1 : page;
  const numPerPage = 10;
  const offset = (page - 1) * numPerPage;

  try {
    const result = await Course.findAndCountAll({
      limit: numPerPage,
      offset: offset,
    });

    /*
     * Generate HATEOAS links for surrounding pages.
     */
    const lastPage = Math.ceil(result.count / numPerPage);
    const links = {};
    if (page < lastPage) {
      links.nextPage = `/courses?page=${page + 1}`;
      links.lastPage = `/courses?page=${lastPage}`;
    }
    if (page > 1) {
      links.prevPage = `/courses?page=${page - 1}`;
      links.firstPage = "/courses?page=1";
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
      links: links,
    });
  } catch (e) {
    next(e);
  }
});

// Fetch data about a specific course:
router.get("/:courseId", async (req, res, next) => {
  const courseId = req.params.courseId;
  try {
    const course = await Course.findByPk(courseId);
    if (course) {
      res.status(200).send(course);
    } else {
      next();
    }
  } catch (e) {
    next(e);
  }
});

// Update data for a specific course
router.patch("/:courseId", async (req, res, next) => {
  const courseId = req.params.courseId;
  try {
    const course = await Course.findByPk(courseId);

    if (!req.admin && Number(req.user) !== Number(course.instructorId)) {
      res.status(403).send({
        error: "Not authorized to access the specified resource",
      });
    } else {
      const result = await Course.update(req.body, {
        where: { id: courseId },
        fields: CourseClientFields,
      });
      if (result[0] > 0) {
        res.status(200).send();
      } else {
        next();
      }
    }
  } catch (e) {
    if (e instanceof ValidationError) {
      res.status(400).send({ error: e.message })
    } else {
      next(e);
    }
  }
});

// Removes a course
router.delete("/:courseId", async (req, res, next) => {
  const courseId = req.params.courseId
  
  try {
    const course = await Course.findByPk(courseId);

    if (!req.admin && Number(req.user) !== Number(course.instructorId)) {
      res.status(403).send({
        error: "Not authorized to access the specified resource",
      });
    } else {
      const result = await Business.destroy({ where: { id: courseId } });
      if (result > 0) {
        res.status(204).send();
      } else {
        next();
      }
    }
  } catch (e) {
    next(e);
  }
})

//Get student roster for a course
router.get('/:courseId/students', async function (req, res, next) {
  const courseId = req.params.courseId

  try {
    const course = await Course.findByPk(courseId)

    if (!course) {
      res.status(404).send({error: "Course Not Found"})
    }

    const students = await User.findAll({
      include: [{
        model: Course,
        where: { id: courseId }
      }],
      where: { role: 'student' }
    })

    res.status(200).send(students)
  } catch (error) {
    next(error)
  }
})

//Update enrollment for a course
router.post("/:courseId/students", async function (req, res, next) {

})

//Fetch a CSV file containing list of the students enrolled in the Course
router.get("/:courseId/roster", async function (req, res, next) {

})

//Fetch a list of the Assignments for the Course.
router.get("/:courseId/assignments", async function (req, res, next) {
  
})
module.exports = router;
