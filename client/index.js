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
  {
    name: 'Stale cache',
    address: 'nginx-stale-cache:8000',
    requests: [
      { time: 0, simulateStatus: 200, info: 'The first request will always hit the upstream.' },
      { time: 2000, simulateStatus: 200, info: 'The second request will be responded to by using the cached data (CACHE HIT).' },
      { time: 4000, simulateStatus: 200, simulatedResponseTime:5000, info: 'API becomes unstable, and it would take 5s (more than timeout) to respond, but as cache is still valid, the cached data will be returned (CACHE HIT).' },
      { time: 15000, simulateStatus: 200, simulatedResponseTime:5000, info: 'Now cache has already expired, but as API is still unavailable, cached data will be returned (CACHE STALE).' },
      { time: 22000, simulateStatus: 500,  info: 'Other simulation of problem: API will return HTTP 500 and CACHE STALE will be returned.' },
      { time: 24000, simulateStatus: 200, info: 'API becomes stable. Cache will be updated and a fresh data will be returned. Cache status = EXPIRED.' },
      { time: 26000, simulateStatus: 200, info: 'As data was refreshed, CACHE HIT was back to work.' },
    ]
  },
  {
    name: 'Locked cache key',
    address: 'nginx-locked-cache:8000',
    requests: [
      { time: 0, simulateStatus: 200, info: 'The first request will always hit the upstream.' },
      { time: 100, simulateStatus: 200, info: 'API did not respond to the first request, this one will wait.' },
      { time: 200, simulateStatus: 200, info: 'API did not respond to the first request, this one will wait.' },
      { time: 300, simulateStatus: 200, info: 'API did not respond to the first request, this one will wait.' },
      { time: 400, simulateStatus: 200, info: 'API did not respond to the first request, this one will wait.' },
      { time: 12000, simulateStatus: 200, info: 'Now the key is expired, we need a new hit to upstream' },
      { time: 12100, simulateStatus: 200, info: 'As Nginx already has some cached data, they will be delivered until updating the cache. CACHE STATUS = UPDATING' },
      { time: 12200, simulateStatus: 200, info: 'As Nginx already has some cached data, they will be delivered until updating the cache. CACHE STATUS = UPDATING' },
      { time: 12300, simulateStatus: 200, info: 'As Nginx already has some cached data, they will be delivered until updating the cache. CACHE STATUS = UPDATING' },
      { time: 12400, simulateStatus: 200, info: 'As Nginx already has some cached data, they will be delivered until updating the cache. CACHE STATUS = UPDATING' },
      { time: 15000, simulateStatus: 200, info: 'Now cache was revalidated, CACHE HIT backs to work' },
    ]
  },
  {
    name: 'Background update',
    address: 'nginx-background-update:8000',
    requests: [
      { time: 0, simulateStatus: 200, info: 'The first request will always hit the upstream.' },
      { time: 15000, simulateStatus: 201, info: 'Despite expired, this request will not wait for upstream. Stale will be returned instead. CACHE STATUS = STALE' },
      { time: 15100, simulateStatus: 200, info: 'While the cache is updated in background, stale continues to be delivered. CACHE STATUS = UPDATING' },
      { time: 15200, simulateStatus: 200, info: 'While the cache is updated in background, stale continues to be delivered. CACHE STATUS = UPDATING' },
      { time: 15300, simulateStatus: 200, info: 'While the cache is updated in background, stale continues to be delivered. CACHE STATUS = UPDATING' },
      { time: 15400, simulateStatus: 200, info: 'While the cache is updated in background, stale continues to be delivered. CACHE STATUS = UPDATING' },
      { time: 18000, simulateStatus: 200, info: 'Now cache was revalidated, CACHE HIT backs to work' },
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