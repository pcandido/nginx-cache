const axios = require('axios')

const tests = [
  {
    name: 'No cache',
    address: 'nginx-no-cache:8000',
    requests: [
      { time: 0, simulateStatus: 200, info: 'The first request will always hit the upstream.' },
      { time: 2000, simulateStatus: 200, info: 'As there is no cache, the second request will hit as well.' },
      { time: 4000, simulateStatus: 200, simulatedResponseTime: 5000, info: 'Any case of time out will be exposed to the client. Note Nginx will not wait for api response.' },
      { time: 10000, simulateStatus: 500, info: 'Any case of error will also be exposed to the client.' },
    ]
  },
  {
    name: 'Simple cache',
    address: 'nginx-simple-cache:8000',
    requests: [
      { time: 0, simulateStatus: 200, info: 'The first request will always hit the upstream.' },
      { time: 2000, simulateStatus: 200, info: 'The second request will be responded to by using the cached data (CACHE HIT). Note how faster it is.' },
      ...(new Array(10).fill(
        { time: 4000, simulateStatus: 200, info: 'Does not matter how many requests are done, if the cache data is there, it will be used.' },
      )),
      { time: 15000, simulateStatus: 200, info: 'Finally, after cached data expires, a new request will hit the upstream.' },
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