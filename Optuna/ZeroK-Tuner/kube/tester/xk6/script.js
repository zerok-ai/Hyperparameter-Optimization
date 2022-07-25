import { check } from 'k6';
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

/* scenario specs */
const preallocVUs = 200;
const maxVUs = 200;
const timeUnit = '1m';

const scenarioStages = {
//
  'highmem' : [
    { duration: '30s', target: 1500 }
  ],
/*/
  'highcpu' : [
    { duration: '30s', target: 400 },
    { duration: '30s', target: 800 }
  ],
//
  'highmem1' : [
    { duration: '1m', target: 1500 },
    { duration: '3m', target: 1500 },
    { duration: '30s', target: 1500 }  
  ],
//
  'highcpu1' : [
    { duration: '1m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '2m', target: 1500 },
    { duration: '4m', target: 1500 },
  ],
//	
  'highload' : [
    { duration: '1m', target: 10000 },
    { duration: '3m', target: 10000 },
    { duration: '30s', target: 10000 }
  ],
//
  'lowload' : [
    { duration: '1m', target: 1000 },
    { duration: '3m', target: 1000 },
    { duration: '30s', target: 1000 }  
  ]
/**/
}

const verticalScaleCount = {
  // Count variable to control Mem consumed by each highmem API call.
  'highmem': 15,  // 1 * 1MB
  'highmem1': 15,  // 1 * 1MB
   // Count variable to control CPU consumed by each highcpu API call.
  'highcpu': 333 * 1000,
  'highcpu1': 333 * 1000
}

const scenarioMetrics = ['waiting', 'duration']

/* End scenario specs */

// const customCounter = new Counter(    {
//   name: 'k6_test_setup',
//   help: 'K6s Test status',
//   labelNames: ['code']
// });

// export function setup() {
//   // 2. setup code
//   customCounter.inc(verticalScaleCount);
// }

// export function teardown(data) {
//   // 4. teardown code
//   customCounter.dec(verticalScaleCount);
// }

var myTrend = {};
const hostname_anton = __ENV.ANTON_HOSTNAME || 'with.getanton.com';
const hostname_base  = __ENV.BASE_HOSTNAME || 'without.getanton.com';
const hosts = {
  target: 'target-service.target.svc.cluster.local'
};

function generateScenarioObj(scenarioName, hostname) {
  return {
    executor: 'ramping-arrival-rate',
    exec: `${hostname}_${scenarioName}`,
    preAllocatedVUs: preallocVUs,
    timeUnit,
    maxVUs,
    // rate: scenarioStages[scenarioName][0].target,
    startRate: scenarioStages[scenarioName][0].target,
    stages: scenarioStages[scenarioName]
  }
}

function generateScenarios() {
  var scenarios = {};
  Object.keys(hosts).forEach((host)=> {
    const hostname = hosts[host];
    Object.keys(scenarioStages).forEach(element => {
      const key = `${host}_${element}`;
      scenarioMetrics.forEach((metric) => {
        myTrend[key] = myTrend[key] || {};
        myTrend[key][metric] = new Trend(`custom_${host}_${element}_${metric}`);
      })
      module.exports[key] = prepareExecFn(element, host);
      scenarios[key] = generateScenarioObj(element, host);
    });  
  });
  // console.log(scenarios);
  return scenarios;
}

export const options = {
  noConnectionReuse: true,
  scenarios: generateScenarios(),
  VUs: preallocVUs,
  ext: {
    loadimpact: {
      apm: [
        {
          provider: 'prometheus',
          remoteWriteURL: 'http://prom-kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090/api/v1/write',
          includeDefaultMetrics: true,
          includeTestRunId: true,
          resampleRate: 3,
        },
      ],
    },
  },
};


function prepareExecFn(scenarioName, host) {
  const hostname = hosts[host];
  const key = `${host}_${scenarioName}`;
  return () => {
    const res = http.get('http://'+hostname+'/'+scenarioName+'?count='+verticalScaleCount[scenarioName]);
    check(res, {
      'verify homepage text': (r) =>
        r.body.includes(scenarioName),
    });
    scenarioMetrics.forEach((metric) => {
    	myTrend[key][metric].add(res.timings[metric], {tag: `${scenarioName}_${metric}`});
    })
    sleep(1);  
  }
}
