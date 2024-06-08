const { DataTypes } = require("sequelize");

const sequelize = require("../lib/sequelize");
const { User } = require("./user");
const { Course } = require("./course")

// Defines a join table for M:M association 
const UserCourse = sequelize.define('UserCourse', {})

Course.belongsToMany(User, { through: UserCourse })
User.belongsToMany(Course, { through: UserCourse })

exports.UserCourse = UserCourse