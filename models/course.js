const { DataTypes } = require('sequelize')

const sequelize = require('../sequelize')

const Course = sequelize.define('course', {
    subject: { type: DataTypes.STRING, allowNull: false },
    number: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    term: { type: DataTypes.STRING, allowNull: false },
    instructorid: {type: DataTypes.INTEGER, allowNull: false}
});


module.exports = Course