require('dotenv').config()

const express = require('express')
const morgan = require('morgan')

const api = require('./api')
const sequelize = require('./lib/sequelize')

const app = express()
const port = process.env.PORT || 8000

const redis = require('redis')
const redisHost = process.env.REDIS_HOST || "localhost"
const redisPort = process.env.REDIS_PORT || 6379

const redisClient = redis.createClient({
  url: `redis://${redisHost}:${redisPort}`
})

const rateLimitMaxReqsUnauthorized = 10
const rateLimitMaxReqsAuthorized = 30
const rateLimitWindowMs = 60000

async function rateLimit(req, res, next) {
  // TODO: Update this function to use Authorization header to determine if user is authorized (When Auth gets implemented)
  const maxRequests = rateLimitMaxReqsUnauthorized
  const key = req.ip

  let tokenBucket
  try {
    tokenBucket = await redisClient.hGetAll(key)
    //console.log('Token bucket:', tokenBucket)
  } catch (e) {
    next()
    return
  }

  tokenBucket = {
    tokens: parseFloat(tokenBucket.tokens) || maxRequests,
    last: parseInt(tokenBucket.last) || Date.now()
  }

  const timestamp = Date.now()
  const ellapsedTimeMs = timestamp - tokenBucket.last
  const refreshRate = maxRequests / rateLimitWindowMs
  tokenBucket.tokens += ellapsedTimeMs * refreshRate
  tokenBucket.tokens = Math.min(maxRequests, tokenBucket.tokens)
  tokenBucket.last = timestamp

  //console.log('Updated token bucket:', tokenBucket)

  if (tokenBucket.tokens >= 1) {
    tokenBucket.tokens -= 1
    await redisClient.hSet(key, [
      ['tokens', tokenBucket.tokens],
      ['last', tokenBucket.last]
    ])
    next()
  } else {
    res.status(429).send({
      err: "Too many requests per minute"
    })
  }
}

/*
 * Morgan is a popular request logger.
 */
app.use(morgan('dev'))

app.use(express.json())

app.use(rateLimit)

/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api)

app.use('*', function (req, res, next) {
    res.status(404).send({
      error: `Requested resource "${req.originalUrl}" does not exist`
    })
  })
  
  /*
   * This route will catch any errors thrown from our API endpoints and return
   * a response with a 500 status to the client.
   */
  app.use('*', function (err, req, res, next) {
    console.error("== Error:", err)
    res.status(500).send({
        error: "Server error.  Please try again later."
    })
  })
  
  /*
   * Start the API server listening for requests after establishing a connection
   * to the MySQL server.
   */
  sequelize.sync().then(function () {
    redisClient.connect().then(() => {
      app.listen(port, () => {
        console.log("== Server is running on port", port);
      });
    })
  })
  