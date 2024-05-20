const { DataTypes } = require('sequelize')

const sequelize = require('../lib/sequelize')
const { Course } = require('./course')

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


exports.Assignment = Assignment