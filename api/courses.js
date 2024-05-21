const { Router } = require("express");
const { ValidationError } = require("sequelize");

const { Course, CourseClientFields } = require("../models/course");

const router = Router();

/*
 * Routes below.
 */

//Create a new course
router.post("/", async (req, res) => {
  try {
    console.log(req.body);
    const course = await Course.create(req.body, CourseClientFields);
    res.status(201).send(course);
  } catch (e) {
    console.log("error", e);
    next(e);
  }
});

//fetch a list of all courses
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

//fetch data about a specific course:
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

//update data for a specific course
router.patch("/:courseId", async (req, res, next) => {
  const courseId = req.params.courseId;
  try {
    const course = await Course.findByPk(courseId);
    res.status(403).send({
      error: "Not authorized to access the specified resource",
    });

    const result = await Course.update(req.body, {
      where: { id: courseId },
      fields: CourseClientFields,
    });
    if (result[0] > 0) {
      res.status(204).send();
    } else {
      next();
    }
  } catch (e) {
    next(e);
  }
});

//removes a course
router.delete("/:courseId", async (req, res, next) => {
  const courseId = req.params.courseId;

  try {
    const course = await Course.findByPk(courseId);

    res.status(403).send({
      error: "Not authorized to access the specified resource",
    });

    const result = await Business.destroy({ where: { id: courseId } });
    if (result > 0) {
      res.status(204).send();
    } else {
      next();
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
