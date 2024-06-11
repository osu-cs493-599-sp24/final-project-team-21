const fs = require("node:fs/promises")
const path = require("node:path")
const amqp = require("amqplib")
require("dotenv").config()

const { User } = require('./models/user')
const { Course } = require('./models/course')
const { UserCourse } = require('./models/userCourse')
const { queueName } = require("./lib/rabbitmq")
const { generateFilename } = require("./lib/multer")
const sequelize = require('./lib/sequelize')

const rabbitmqHost = process.env.RABBITMQ_HOST || "localhost"
const rabbitmqUrl = `amqp://${rabbitmqHost}`

async function main() {
    try {
        await sequelize.sync()
        const connection = await amqp.connect(rabbitmqUrl)
        const channel = await connection.createChannel()
        await channel.assertQueue(queueName)

        channel.consume(queueName, async msg => {
            if (msg) {
                const courseId = msg.content.toString()
                console.log("== courseId:", courseId)
                const course = await Course.findByPk(courseId)
                const students = await course.getUsers()
                // Write userIds, names, and emails to a CSV file
                const filename = `${generateFilename(courseId)}.csv`
                const filePath = path.join(__dirname, "./lib/rosters", filename)
                await fs.writeFile(filePath, "userId,name,email\n")
                let added = [] // Remove duplicates
                for (const student of students) {
                    if (added.includes(student.id)) {
                        continue
                    }
                    await fs.appendFile(filePath, `${student.id},${student.name},${student.email}\n`)
                    added.push(student.id)
                }
                console.log("== Roster generated:", filename)
                channel.ack(msg)
            }
        })
    } catch (e) {
        console.error("== Error:", e)
    }
}

main()