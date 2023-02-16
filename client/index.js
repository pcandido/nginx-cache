const axios = require('axios')

const tests = [
  {
    name: 'No cache',
    address: 'nginx-no-cache:8000',
    requests: [
      { time: 0, simulateStatus: 200 },
      { time: 2000, simulateStatus: 200 },
      { time: 6000, simulateStatus: 200 },
      { time: 30000, simulateStatus: 200 },
      { time: 32000, simulateStatus: 500 },
      { time: 54000, simulateStatus: 500 },
      { time: 56000, simulateStatus: 200, simulatedResponseTime: 5000 },
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
        console.log(`Requested at t=${request.time} (${request.time - lastTime}ms from the last).`)
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