import { ScheduleProvider } from './../logic/scheduleProvider';
import defaultSchedule from "../settings/defaultSchedule";
import { ScheduleData } from "../settings/scheduleDataType";
import { readFile, writeFile, writeFileSync, existsSync } from 'fs';

/**
 * 
 */
export default class ScheduleDataProvider {

    /**
     * 
     * @param dataFile 
     * @param scheduleProvider 
     */
    constructor(public readonly dataFile: string, public readonly scheduleProvider: ScheduleProvider) {
        scheduleProvider.subscribeToScheduleChanges((_, newSchedule) => {
            this.storeSchedule(newSchedule)
        })
    }

    /**
     * Write to disk
     * @param schedule 
     */
    public async storeSchedule(schedule: ScheduleData): Promise<void> {
        writeFileSync(this.dataFile, JSON.stringify(schedule, null, 2), 'utf8')
        // This may damage the file if during execution the server fails or is stopped
        /*
        return new Promise<void>((resolve, reject) => {
            writeFile(this.dataFile, JSON.stringify(schedule, null, 2), 'utf8', function(err) {
                if(err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
        */
    }

    /**
     * 
     */
    public async loadSchedule(): Promise<void> { 
        const schedule = await this.readScheduleFromDisk()
        // TODO: this will trigger storeSchedule since we listen to changes
        this.scheduleProvider.setSchedule(schedule)
    }

    /**
     * 
     */
    public async readScheduleFromDisk(): Promise<ScheduleData> {
        return new Promise<ScheduleData>((resolve, reject) => {
            if (!existsSync(this.dataFile)) {
                resolve(defaultSchedule)
                return
            }
            readFile(this.dataFile, 'utf8', function(err, data) {
                if(err) {
                    reject(err)
                } else {
                    try {
                        const schedule: ScheduleData = JSON.parse(data) as ScheduleData
                        resolve(schedule)
                    } catch (e) {
                        console.error(new Error('Invalid schedule file content. Falling back to default schedule.'))
                        resolve(defaultSchedule)
                    }
                }
            })
        })
    }
}