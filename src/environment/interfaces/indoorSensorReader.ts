/**
 * 
 */
export interface IndoorSensorData {
    temperature: number
    humidity: number
}

/**
 * 
 */
export default interface IndoorSensorReader {
    getEnvironment(): Promise<IndoorSensorData>
}