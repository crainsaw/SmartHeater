import OutdoorSensorReader, { OutdoorSensorData } from "../interfaces/outdoorSensorReader";


export default class DummyWheatherAPIReader implements OutdoorSensorReader {

    /**
     * 
     */
    public getEnvironment(): Promise<OutdoorSensorData> {
        return new Promise<OutdoorSensorData>((resolve, reject) => {
            resolve({
                temperature: 99
            })
        })
    }

}