const { DataTypes } = require("sequelize");

const sequelize = require("../lib/sequelize");
const { Submission } = require("./submission");

const User = sequelize.define("user", {
    name: { type: DataTypes.STRING, allowNull: false},
    email: { type: DataTypes.STRING, allowNull: false},
    password: { type: DataTypes.STRING, allowNull: false},
    role: {type: DataTypes.STRING, allowNull: false}
});

User.hasMany(Submission, {foreignKey: {allowNull: false}})
Submission.belongsTo(User)

exports.User = User
exports.UserClientFields = [
    "name",
    "email",
    "password",
    "role",
    "courseId"
]