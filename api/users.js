const { Router } = require('express')
const { ValidationError } = require('sequelize');
const { User, UserClientFields } = require('../models/user');


const router = Router()

/*
 * Routes below.
 */
router.post("/", async (req, res, next) => {
    // TODO: Update this as needed. Implemented basic POST since user is associated with Submission model.
    try {
        console.log(req.body)
      const user = await User.create(req.body, UserClientFields);
      res.status(201).send({ id: user.id });
    } catch (e) {
      if (e instanceof ValidationError) {
        res.status(400).send({ error: e.message })
      } else {
        next(e);
      }
    }
  });


module.exports = router