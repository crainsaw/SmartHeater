import { OneTimeOverride, ScheduleItem, OneTimeTarget } from './../logic/scheduleProvider';

export interface ScheduleData {
    defaultTemperature: number,
    schedule: ScheduleItem[],
    oneTimeOverrides: OneTimeTarget[],
    manualOverride: OneTimeOverride | null
}