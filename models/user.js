const { DataTypes } = require("sequelize");
const bcrypt = require('bcryptjs')

const sequelize = require("../lib/sequelize");
const { Submission } = require("./submission");
const { Course } = require('./course')

const User = sequelize.define("user", {
    name: { type: DataTypes.STRING, allowNull: false},
    email: { type: DataTypes.STRING, allowNull: false},
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
            this.setDataValue('password', bcrypt.hashSync(value, 8))
        }
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [["admin", "instructor", "student"]]
        }
    }
})

User.hasMany(Course, { foreignKey: { name: "instructorId", allowNull: false } })
Course.belongsTo(User, { foreignKey: { name: "instructorId", allowNull: false } })

User.hasMany(Submission, { foreignKey: { allowNull: false } })
Submission.belongsTo(User)

exports.User = User
exports.UserClientFields = [
    "name",
    "email",
    "password",
    "role"
]