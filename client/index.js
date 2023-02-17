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
  }
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