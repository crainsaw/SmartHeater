import { Environment } from '../../environment/environmentProvider';
import { appendFile, exists } from 'fs';


/**
 * Stores historical data which can be used to tune the algorithms
 */
export default class HistoricalDataProvider {

    /**
     * 
     * @param environmentFile 
     * @param heaterStatusFile 
     */
    constructor(public environmentFile: string, public heaterStatusFile: string) { }

    /**
     * 
     * @param date 
     * @param env 
     */
    public async storeEnvironmentReading(date: number, env: Environment): Promise<void> {
        const data = {
            ...env,
            date: Math.floor(date * 1.0 / 1000)
        }
        return new Promise<void>((resolve, reject) => {
            exists(this.environmentFile, (fileExists) => {
                const header = !fileExists ? 'time, temperature, humidity, ambientTemperature\n' : ''
                const content = `${header}${data.date},${data.temperature},${data.humidity},${data.outsideTemperature}\n`
                appendFile(this.environmentFile, content, function (err) {
                    if (err) reject(err)
                    else resolve()
                })
            })
            
        })
        
    }
    
    /**
     * 
     * @param date 
     * @param enabled 
     * @param targetTemperature 
     */
    public async storeHeaterStatusChange(date: number, enabled: boolean, targetTemperature: number): Promise<void> {
        const data = {
            date: Math.floor(date * 1.0 / 1000),
            enabled: enabled ? 1 : 0,
            targetTemp: targetTemperature
        }

        return new Promise<void>((resolve, reject) => {
            exists(this.heaterStatusFile, (fileExists) => {
                const header = !fileExists ? 'time, enabled, targetTemperature\n' : ''
                const content = `${header}${data.date},${data.enabled},${data.targetTemp}\n`
                appendFile(this.heaterStatusFile, content, function (err) {
                    if (err) reject(err)
                    else resolve()
                })
            })
            
        })
    }
}