const { DataTypes } = require("sequelize");

const sequelize = require("../lib/sequelize");

const Submission = sequelize.define("submission", {
    timestamp: {type: DataTypes.DATE, allowNull: false},
    grade: {type: DataTypes.FLOAT, allowNull: false},
    file: {type: DataTypes.STRING, allowNull: false}
});

exports.Submission = Submission
exports.UserClientFields = [
    "userId",
    "assignmentId",
    "timestamp",
    "grade",
    "file"
]