const axios = require('axios')

const tests = [
  {
    name: 'Background update',
    address: 'nginx-background-update:8000',
    requests: [
      { time: 0, simulateStatus: 200, info: 'The first request will always hit the upstream.' },
      { time: 15000, simulateStatus: 201, info: 'Despite expired, this request will not wait for upstream. Stale will be returned instead. Expected cache status = STALE' },
      { time: 15100, simulateStatus: 200, info: 'While the cache is updated in background, stale continues to be delivered. Expected cache status = UPDATING' },
      { time: 15200, simulateStatus: 200, info: 'While the cache is updated in background, stale continues to be delivered. Expected cache status = UPDATING' },
      { time: 15300, simulateStatus: 200, info: 'While the cache is updated in background, stale continues to be delivered. Expected cache status = UPDATING' },
      { time: 15400, simulateStatus: 200, info: 'While the cache is updated in background, stale continues to be delivered. Expected cache status = UPDATING' },
      { time: 18000, simulateStatus: 200, info: 'Now cache was revalidated, CACHE HIT backs to work.' },
      { time: 30000, simulateStatus: 500, info: 'Cache is invalid again. But now, the upstream will respond with 500. Expect to deliver STALE. But I wont be able to see the problem on Nginx logs.' },
    ]
  },
]

async function run() {
  for (const testCase of tests) {
    console.log('\n\n--------------------------------------------')
    console.log(testCase.name, '\n')

    await Promise.all(testCase.requests.map((request, requestIndex) => new Promise(done => {
      setTimeout(async () => {
        const lastTime = testCase.requests[requestIndex - 1]?.time ?? 0
        console.log(`Requested at t=${request.time} (${request.time - lastTime}ms from the last). ${request.info}`)
        try {
          await axios(`http://${testCase.address}`, {
            params: {
              status: request.simulateStatus,
              time: request.simulatedResponseTime
            }
          })
        } catch { }
        done()
      }, request.time)
    })))
  }
}

run()