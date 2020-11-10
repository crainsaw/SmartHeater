import { ScheduleData } from './heating/settings/scheduleDataType';
import { Environment } from './environment/environmentProvider';
import { ScheduleProvider } from './heating/logic/scheduleProvider';
import HeatTimePredictor, { TrainingItem } from './heating/logic/heatTimePredictor';

// ----------------------
const schedule: ScheduleData = {
    defaultTemperature: 10,
    schedule: [
        {
             startTimeOfDayMin: 7*60,
             endTimeOfDayMin: 16*60,
             targetTemperature: 20,
             dayOfWeekFilter: {
                 monday: true,
                 thuesday: true,
                 wednesday: true,
                 thursday: true,
                 friday: true
             }
        },
        {
            startTimeOfDayMin: 16*60,
            endTimeOfDayMin: 22*60,
            targetTemperature: 30,
            dayOfWeekFilter: {
                monday: true,
                 thuesday: true,
                 wednesday: true,
                 thursday: true,
                 friday: true
            }
       }
    ],
    oneTimeOverrides: [],
    manualOverride: {
        startTime: Date.now(),
        endTime: Date.now() + 6*60*60*1000,
        targetTemperature: 50
    }
}

// -------------------------------

const trainData: TrainingItem = {
    startTimestamp: 1,
    recentHeaterUsage: 0,
    snapshots: [
        {
            minsSinceStart: 0,
            environment: {
                temperature: 15,
                humidity: 0.75,
                outsideTemperature: 11
            }
        },
        {
            minsSinceStart: 10,
            environment: {
                temperature: 16,
                humidity: 0.75,
                outsideTemperature: 11
            }
        },
        {
            minsSinceStart: 20,
            environment: {
                temperature: 17,
                humidity: 0.75,
                outsideTemperature: 11
            }
        },
        {
            minsSinceStart: 30,
            environment: {
                temperature: 18,
                humidity: 0.75,
                outsideTemperature: 11
            }
        }
    ]
}

const schedule2: ScheduleData = {
    "defaultTemperature": 19,
    "schedule": [
      {
        "startTimeOfDayMin": 420,
        "endTimeOfDayMin": 480,
        "dayOfWeekFilter": {
          "monday": true,
          "thuesday": true,
          "wednesday": true,
          "thursday": true,
          "friday": true
        },
        "targetTemperature": 21
      },
      {
        "startTimeOfDayMin": 1140,
        "endTimeOfDayMin": 1320,
        "dayOfWeekFilter": {
          "monday": true,
          "thuesday": true,
          "wednesday": true,
          "thursday": true,
          "friday": true
        },
        "targetTemperature": 21
      },
      {
        "startTimeOfDayMin": 540,
        "endTimeOfDayMin": 1380,
        "dayOfWeekFilter": {
          "saturday": true,
          "sunday": true
        },
        "targetTemperature": 23
      }
    ],
    "oneTimeOverrides": [],
    "manualOverride": {
      "startTime": 1586495290663,
      "endTime": 1586502490663,
      "targetTemperature": 8
    }
  }
const curTime2 = 1586495371499

const curEnv: Environment = {
    temperature: 15,
    humidity: 0.75,
    outsideTemperature: 11
}


// -------------------- TEST
export function test() {

    const s = new ScheduleProvider()

    s.setSchedule(schedule2)

    const targets = s.getHeatingTargets(curTime2)

    console.log(targets)

    console.log("FInished")


    // ------------------------ Test 2

    const predictor = new HeatTimePredictor([trainData])
    const predictedTime = predictor.calculateHeatTime(21, curEnv, curTime2)
    console.log('Num minutes to heat up: ', Math.ceil(predictedTime / 1000 / 60 ))
}
