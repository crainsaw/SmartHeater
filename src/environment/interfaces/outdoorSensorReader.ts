export interface OutdoorSensorData {
    temperature: number
}

export default interface OutdoorSensorReader {
    getEnvironment(): Promise<OutdoorSensorData>
}