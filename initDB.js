require("dotenv").config();
const sequelize = require("./lib/sequelize");
const { User } = require("./models/user");
const { Course, CourseClientFields } = require("./models/course");
const { UserCourse } = require("./models/userCourse");
const { Submission } = require("./models/submission");
const { Assignment } = require("./models/assignment");

const courseData = require("./data/courses.json");

sequelize.sync().then(async () => {
    await User.create({
        name: "Tarpaulin",
        email: "admin@tarpaulin.com",
        password: "hunter2",
        role: "admin"
    });
    await User.create({
        "name": "Robin Hess",
        "email": "hessro@oregonstate.edu",
        "password": "hunter2",
        "role": "instructor"
    });
    await User.create({
        "name": "Karson Paul",
        "email": "paulk@oregonstate.edu",
        "password": "hunter2",
        "role": "student"
    });
    await User.create({
        "name": "Parson Kaul",
        "email": "kaulp@oregonstate.edu",
        "password": "hunter2",
        "role": "student"
    });
    await Course.bulkCreate(courseData, { fields: CourseClientFields });
});