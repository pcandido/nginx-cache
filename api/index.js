const express = require('express')
const { v4: uuid } = require('uuid')

process.on('SIGTERM', () => process.exit())

const app = new express()

app.get('/', async (req, res) => {
  const start = new Date().getTime()

  const statusCode = parseInt(req.query.status ?? '200')
  const requestTime = parseInt(req.query.time ?? '1000')
  const requestId = req.header('X-Request-ID')
  const responseId = uuid()

  await new Promise(res => setTimeout(res, requestTime))

  const end = new Date().getTime()
  console.log(`Returned ${statusCode} in ${((end - start) / 1000).toFixed(3)}s. Request id: ${requestId}. Response id: ${responseId}.`)

  res
    .append('response_id', responseId)
    .status(statusCode)
    .json({ statusCode, requestTime, requestId, responseId })
})

app.listen(3000, () => {
  console.log('Listening on http://localhost:3000')
})
