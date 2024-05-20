const { DataTypes } = require('sequelize')

const sequelize = require('../lib/sequelize')
const Course = require('./course')

const Assignment = sequelize.define('assignment', {
    courseid: { 
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

Course.hasMany(Assignment, { foreignKey: 'courseid' });
Assignment.belongsTo(Course, { foreignKey: 'courseid' });


module.exports = Assignment