const { DataTypes } = require("sequelize");

const sequelize = require("../lib/sequelize");

const Submission = sequelize.define("submission", {
    timestamp: {type: DataTypes.DATE, allowNull: false},
    grade: {type: DataTypes.FLOAT, allowNull: true, defaultValue: null},
    file: {type: DataTypes.STRING, allowNull: false}
});

exports.Submission = Submission
exports.UserClientFields = [
    "assignmentId",
    "userId",
    "timestamp",
    "grade",
    "file"
]