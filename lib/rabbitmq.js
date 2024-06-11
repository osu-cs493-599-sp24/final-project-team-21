const amqp = require('amqplib')

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost'
const rabbitmqUrl = `amqp://${rabbitmqHost}`

let _channel

const queueName = 'rosters'
exports.queueName = queueName

exports.connectToRabbitMQ = async function () {
    const connection = await amqp.connect(rabbitmqUrl)
    _channel = await connection.createChannel()
    await _channel.assertQueue(queueName)
}

exports.getChannel = function () {
    return _channel
}