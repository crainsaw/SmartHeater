import { ScheduleData } from "./scheduleDataType"

const defaultSchedule: ScheduleData = {
    defaultTemperature: 19,
    schedule: [
        {
            startTimeOfDayMin: 7*60,
            endTimeOfDayMin: 8*60,
            dayOfWeekFilter: {
                monday: true,
                thuesday: true,
                wednesday: true,
                thursday: true,
                friday: true
            },
            targetTemperature: 21
        },
        {
            startTimeOfDayMin: 19*60,
            endTimeOfDayMin: 22*60,
            dayOfWeekFilter: {
                monday: true,
                thuesday: true,
                wednesday: true,
                thursday: true,
                friday: true
            },
            targetTemperature: 21
        },
        {
            startTimeOfDayMin: 9*60,
            endTimeOfDayMin: 23*60,
            dayOfWeekFilter: {
                saturday: true,
                sunday: true,
            },
            targetTemperature: 23
        },
    ],
    oneTimeOverrides: [],
    manualOverride: null
}

export default defaultSchedule