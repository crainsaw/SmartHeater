import IndoorSensorReader, { IndoorSensorData } from "../interfaces/indoorSensorReader";

export default class DummyIndoorReader implements IndoorSensorReader {
    
    public async getEnvironment(): Promise<IndoorSensorData> {
        return {
            temperature: 18.0,
            humidity: 66,
        }
    }

}