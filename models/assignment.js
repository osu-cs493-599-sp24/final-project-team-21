const { DataTypes } = require('sequelize')

const sequelize = require('../lib/sequelize')
const { Course } = require('./course');
const { Submission } = require('./submission');

const Assignment = sequelize.define('assignment', {
    courseId: { 
        type: DataTypes.INTEGER, 
        allowNull: false, references: {
        model: Course,
        key: 'id'
    },
},
    title: { type: DataTypes.STRING, allowNull: false },
    points: { type: DataTypes.INTEGER, allowNull: false },
    due: { type: DataTypes.DATE, allowNull: false },
});

Course.hasMany(Assignment, { foreignKey: 'courseId' });
Assignment.belongsTo(Course, { foreignKey: 'courseId' });

Assignment.hasMany(Submission, { foreignKey: { allowNull: false }, onDelete: "CASCADE" })
Submission.belongsTo(Assignment)

/*
 * Export an array containing the names of fields the client is allowed to set
 * on assignments
 */
exports.AssignmentClientFields = [
    'courseId',
    'title',
    'points',
    'due'
]


exports.Assignment = Assignment