import IndoorSensorReader, { IndoorSensorData } from "../interfaces/indoorSensorReader";
import { spawnPrc } from "../utils/process";
import { DHT_SETTINGS } from "../../env";

/**
 * Reads the sensor data from the DHT22
 */
export default class DHT22Reader implements IndoorSensorReader {

    /**
    * 
    * @param stdOutLine 
    */
   protected parseDhtResponse(stdOutLine: string): IndoorSensorData {
       const regex = /Temp=([0-9\.]*)\*\s+Humidity=([0-9\.]*)%/
       const match = stdOutLine.match(regex)
       if(match !== null) {
           return {
               temperature: parseFloat(match[1]),
               humidity: parseFloat(match[2])
           }
       } else {
           throw Error('Could not parse DHT sensor reading.')
       }
   }
   
   /**
    * 
    */
    public async getEnvironment(): Promise<IndoorSensorData> {
        return new Promise<IndoorSensorData>((resolve, reject) => {
            const results: string[] = []
            const errors: string[] = []
            // spawn process
            spawnPrc('python', [DHT_SETTINGS.path, DHT_SETTINGS.a.toString(), DHT_SETTINGS.b.toString()], {
                onData: (data: string) => {
                    results.push(data)
                },
                onError: (err: string) => {
                    errors.push(err)
                },
                onClose: (code: number) => {
                    if (code === 0) {
                        const data = this.parseDhtResponse(results[0])
                        resolve(data)
                    } else {
                        const errMsg = results.join('\n')
                        reject(new Error(`dht reader exited with code ${code} and message: ${errMsg}`))
                    }   
                }
            })
        })
    }

}