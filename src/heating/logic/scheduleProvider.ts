
/**
 * 
 */
export interface DayOfWeekMask {
    monday?: boolean,
    thuesday?: boolean,
    wednesday?: boolean,
    thursday?: boolean,
    friday?: boolean,
    saturday?: boolean,
    sunday?: boolean
}

/**
 * 
 */
export interface ScheduleItem {
    dayOfWeekFilter: DayOfWeekMask 
    // start time of the day given in minutes since midnight
    startTimeOfDayMin: number
    // end time of the day given in minutes since midnight (i.e. maximum would be 24*60-1)
    endTimeOfDayMin: number
    // target temperature
    targetTemperature: number
}


/**
 * Overrides have the highest priority and are only valid for a certian amount of time
 */
export interface OneTimeTarget {
    // timestamp
    startTime: number
    // endTime
    endTime: number,
    // the schedule item that is valid in this period only
    schedule: ScheduleItem
}


/**
 * A manual override overrides all other schedules and is used to set enforce a certain temperature for a certain amount of time
 */
export interface OneTimeOverride {
    startTime: number
    endTime: number
    targetTemperature: number
}

/**
 * 
 */
export interface ScheduleData {
    defaultTemperature: number,
    schedule: ScheduleItem[],
    oneTimeOverrides: OneTimeTarget[],
    manualOverride: OneTimeOverride | null
}


/**
 * The priority of the different schedule entries.
 * Default temperature has lowest priority and manual override the highest.
 */
export enum TargetPriority {
    DEFAULT_TEMPERATURE = 0,
    SCHEDULE = 1,
    ONE_TIME_OVERRIDE = 2,
    MANUAL_OVERRIDE = 3
}

/**
 * 
 */
interface DayInfo {
    startTime: number
    dayOfWeek: number
}

/**
 * Used to express how two targets intersect
 */
enum IntersectionType {
    NO_INTERSECTION = 'NO_INTERSECTION',
    STARTS_IN_TARGET = 'START_IN_TARGET',
    END_IN_TARGET = 'END_IN_TARGET',
    ENCLOSES_TARGET = 'ENCLOSES_TARGET',
    EMBEDDED_IN_TARGET = 'EMBEDDED_IN_TARGET'
}

/**
 * 
 */
export interface HeatingTarget {
    // the timestamp at which this target temperature should be reached
    startTime: number
    // the timestamp at which this target temperature should be reached
    endTime: number
    // the target temperature which shall be reached at startTime
    targetTemperature: number
    // the priority
    priority: TargetPriority
}

/**
 * 
 */
export type ScheduleChangeListener = (oldSchedule: ScheduleData, newSchedule: ScheduleData) => void


/**
 * The target temperature can be defined on four levels:
 * 1) Define a standard temperature which is applied when no other schedule is currently available
 * 2) Define a schedule item which defines the target temperature for a certain period of the day for some weekdays
 * 3) One-Time overrides which define schedule items which are only valid for a period of time (e.g. holidays, weekends not at home, evening with friends)
 * 4) Manual override (e.g. the switch the heater on or off for the next x minutes)
 * Important notice about timestamps:
 * All timestamps need to be given in milliseconds and need to be in the current timezone (i.e. need to be what Date.getTime() returns)
 */
export class ScheduleProvider {

    /**
     * Default temperature when no schedule is matched
     * Priority: LOW
     */
    protected defaultTemperature: number = 21

    /**
     * Regular schedule
     * Priority: NORMAL
     */
    protected defaultSchedule: ScheduleItem[] = []
    
    /**
     * One time overrides may lower or higher the temperature for a certain period of time
     * Priority: HIGH
     */
    protected oneTimeOverrides: OneTimeTarget[] = []

    /**
     * The manual override is used to set the current temperature manually and overrides all other schedules
     * Priority: OVERRIDE
     */
    protected manualOverride: OneTimeOverride | null = null

    /**
     * 
     */
    protected changeListeners: ScheduleChangeListener[] = []

    /**
     * 
     */
    public getSchedule(): ScheduleData {
        return {
            defaultTemperature: this.defaultTemperature,
            schedule: this.defaultSchedule,
            oneTimeOverrides: this.oneTimeOverrides,
            manualOverride: this.manualOverride
        }
    }

    /**
     * 
     * @param schedule 
     */
    public setSchedule(schedule: ScheduleData): void {
        const oldSchedule = this.getSchedule()
        this.defaultTemperature = schedule.defaultTemperature
        this.defaultSchedule = schedule.schedule
        this.oneTimeOverrides = schedule.oneTimeOverrides
        this.manualOverride = schedule.manualOverride
        const newSchedule = this.getSchedule()
        // inform listeners
        for (const listener of this.changeListeners) {
            listener(oldSchedule, newSchedule)
        }
    }

    /**
     * 
     * @param listener 
     */
    public subscribeToScheduleChanges(listener: ScheduleChangeListener): void {
        this.changeListeners.push(listener)
    }


    /**
     * 
     * @param curTime 
     */
    public removeOutdatedOverrides(curTime: number): void {
        // remove manual override
        if (this.manualOverride !== null && this.manualOverride.endTime <= curTime) {
            this.manualOverride = null
        }
        // remove from one time overrides
        this.oneTimeOverrides = this.oneTimeOverrides.filter((s) => s.endTime <= curTime)
    }

    /**
     * 
     * @param curTime 
     * @param minLookaheadTimeMins
     */
    public getHeatingTargets(curTime: number | null = null, minLookaheadTimeMins = 24*60): HeatingTarget[] {
        if (curTime === null) {
            curTime = Date.now()
        }
        this.removeOutdatedOverrides(curTime)
        const endTime = curTime + minLookaheadTimeMins * 60 * 1000

        let targets: HeatingTarget[] = []

        // check for manual override which enforces the set temperature
        if (this.manualOverride !== null) {
            const override = this.manualOverride
            const heatingTarget: HeatingTarget = {
                startTime: override.startTime,
                endTime: override.endTime,
                targetTemperature: override.targetTemperature,
                priority: TargetPriority.MANUAL_OVERRIDE
            }
            targets.push(heatingTarget)
        }

        // get the days in the given period so that we can apply the schedules onto it
        const daysInPeriod = this.getDayInfoInPeriod(curTime, endTime)

        // add one time overrides
        for (const s of this.oneTimeOverrides) {
            if (curTime >= s.startTime && curTime <= s.endTime) {
                const includedTargets = this.getTargets(s.schedule, TargetPriority.ONE_TIME_OVERRIDE, daysInPeriod, curTime)
                for (const target of includedTargets) {
                    targets = this.mergeIntoTargets(targets, target)
                }
            }
        }

        // add normal schedule items
        for (const s of this.defaultSchedule) {
            const includedTargets = this.getTargets(s, TargetPriority.SCHEDULE, daysInPeriod, curTime)
            for (const target of includedTargets) {
                targets = this.mergeIntoTargets(targets, target)
            }
        }

        // add default
        const defaultTarget: HeatingTarget = {
            startTime: curTime,
            endTime: endTime,
            targetTemperature: this.defaultTemperature,
            priority: TargetPriority.DEFAULT_TEMPERATURE
        }
        targets = this.mergeIntoTargets(targets, defaultTarget)

        // return 
        return targets
    }

    /**
     * 
     * @param s 
     * @param curTime 
     * @param endTime 
     */
    protected getTargets(s: ScheduleItem, priority: TargetPriority, daysInPeriod: DayInfo[], curTime: number): HeatingTarget[] {
        // now generate heating targets accordingly
        const heatingTargets: HeatingTarget[] = []
        for (const day of daysInPeriod) {
            if (this.filterMatchesDay(s.dayOfWeekFilter, day.dayOfWeek)) {
                const targetStartTime = day.startTime + s.startTimeOfDayMin * 60 * 1000
                const targetEndTime = day.startTime + s.endTimeOfDayMin * 60 *1000
                if (targetEndTime > curTime) {
                    const target: HeatingTarget = {
                        startTime: Math.max(targetStartTime, curTime),
                        endTime: targetEndTime,
                        targetTemperature: s.targetTemperature,
                        priority: priority
                    }
                    heatingTargets.push(target)
                }
            }
        }
        return heatingTargets
    }

    /**
     * 
     * @param curTime timestamp
     * @param endTime timestamp
     */
    protected getDayInfoInPeriod(curTime: number, endTime: number): DayInfo[] {
        // get the first day
        const firstDate = this.getStartOfDay(new Date(curTime))
        const firstDayInfo: DayInfo = {
            startTime: firstDate.getTime(),
            dayOfWeek: firstDate.getDay()
        }
        // get other days in the given period
        const daysInPeriod: DayInfo[] = [firstDayInfo]
        let curDay = firstDayInfo
        const oneDayMS = 24*60*60*1000
        while(curDay.startTime + oneDayMS <= endTime) {
            curDay = {
                startTime: curDay.startTime + oneDayMS,
                dayOfWeek: (curDay.dayOfWeek + 1) % 7
            }
            daysInPeriod.push(curDay)
        }
        return daysInPeriod
    }


    /**
     * 
     * @param time 
     * @param addDays 
     */
    private getStartOfDay(time: Date): Date {
        return new Date(time.getFullYear(), time.getMonth(), time.getDate())
    }


    /**
     * Merges the target into the existing list of targets.
     * @param target 
     * @param targets 
     */
    protected mergeIntoTargets(targets: HeatingTarget[], newTarget: HeatingTarget): HeatingTarget[] {
        let curNewTarget: HeatingTarget = {...newTarget}
        const targetsToRemove: HeatingTarget[] = []
        const targetsToAdd: HeatingTarget[] = []

        // create operations
        let shouldBreak = false
        for(let i = 0; i < targets.length && !shouldBreak; i++) {
            const target = targets[i]

            const relation = this.getIntersectionRelation(target, curNewTarget)
            const shouldReplace = ScheduleProvider.hasHigherPrio(target, curNewTarget)
            
            switch(relation) {
                case IntersectionType.NO_INTERSECTION:
                    break
                case IntersectionType.STARTS_IN_TARGET:
                    if (shouldReplace) {
                        targetsToRemove.push(target)
                        targetsToAdd.push({
                            ...target,
                            endTime: curNewTarget.startTime
                        })
                    } else {
                        curNewTarget.startTime = target.endTime
                    }
                    break
                case IntersectionType.END_IN_TARGET:
                    if (shouldReplace) {
                        targetsToRemove.push(target)
                        targetsToAdd.push({
                            ...target,
                            startTime: curNewTarget.endTime
                        })
                    } else {
                        curNewTarget.endTime = target.startTime
                    }
                    break
                case IntersectionType.ENCLOSES_TARGET:
                    if (shouldReplace) {
                        // remove target completely
                        targetsToRemove.push(target)
                    } else {
                        // split curNewTarget
                        const leftNewTarget: HeatingTarget = {
                            ...curNewTarget,
                            endTime: target.startTime
                        }
                        curNewTarget.startTime = target.endTime
                        if (leftNewTarget.startTime !== leftNewTarget.endTime) targetsToAdd.push(leftNewTarget)
                    }
                    break
                case IntersectionType.EMBEDDED_IN_TARGET:
                    if (shouldReplace) {
                        // split target
                        targetsToRemove.push(target)
                        const leftTarget: HeatingTarget = {
                            ...target,
                            endTime: curNewTarget.startTime
                        }
                        const rightTarget: HeatingTarget = {
                            ...target,
                            startTime: curNewTarget.endTime
                        }
                        if (leftTarget.startTime !== leftTarget.endTime) targetsToAdd.push(leftTarget)
                        if (rightTarget.startTime !== rightTarget.endTime) targetsToAdd.push(rightTarget)
                        shouldBreak = true
                    } else {
                        // remove curNewTarget completely
                        shouldBreak = true
                    }
                    break
                default:
                    throw Error('Unexpected error')
            }
        }

        // perform operations
        const filteredTargets = targets.filter((t) => targetsToRemove.indexOf(t) < 0)
        const result = filteredTargets.concat(targetsToAdd)
        if (!shouldBreak) {
            result.push(curNewTarget)
        }
        result.sort((t1, t2) => t1.startTime - t2.startTime)

        return result
    }


    /**
     * Checks weather the otherTarget has a higher priority than target
     * @param target 
     * @param otherTarget 
     */
    public static hasHigherPrio(target: HeatingTarget, otherTarget: HeatingTarget): boolean {
        const isHigherPrio = otherTarget.priority > target.priority
        const isSamePrioButWarmer = otherTarget.priority === target.priority && otherTarget.targetTemperature > target.targetTemperature
        return isHigherPrio || isSamePrioButWarmer
    }


    /**
     * Checks the temporal relation of two HeatingTargets
     * @param target 
     * @param targetToTest 
     */
    private getIntersectionRelation(target: HeatingTarget, targetToTest: HeatingTarget): IntersectionType {
        if (targetToTest.startTime <= target.startTime && targetToTest.endTime >= target.endTime) {
            return IntersectionType.ENCLOSES_TARGET
        }
        // case 1: newTarget start is in period of target
        // target: ---||||||---
        // newTar: -----||||||-
        const startIsInTarget = targetToTest.startTime >= target.startTime && targetToTest.startTime <= target.endTime
        // case 2: newTarget end is in period of target
        // target: ---||||||---
        // newTar: -||||||-----
        const endIsInTarget = targetToTest.endTime >= target.startTime && targetToTest.endTime <= target.endTime
        // infer relation
        if (startIsInTarget && endIsInTarget) return IntersectionType.EMBEDDED_IN_TARGET
        if (startIsInTarget) return IntersectionType.STARTS_IN_TARGET
        if (endIsInTarget) return IntersectionType.END_IN_TARGET
        return IntersectionType.NO_INTERSECTION
    }

    /**
     * 
     * @param filter 
     * @param dayOfTheWeek integer as returned by date.getDay() (i.e. 0 for Sunday)
     */
    protected filterMatchesDay(filter: DayOfWeekMask, dayOfTheWeek: number) {
        switch(dayOfTheWeek) {
            case 0:
                return filter.sunday ? filter.sunday : false
            case 1:
                return filter.monday ? filter.monday : false
            case 2:
                return filter.thuesday ? filter.thuesday : false
            case 3:
                return filter.wednesday ? filter.wednesday : false
            case 4:
                return filter.thursday ? filter.thursday : false
            case 5:
                return filter.friday ? filter.friday : false
            case 6:
                return filter.saturday ? filter.saturday : false
            default:
                throw Error('Invalid argument supplied. Day of the week need to be in range 0 to 6 (inclusive)')
        }
    }
}