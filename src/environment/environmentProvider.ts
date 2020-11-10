import IndoorSensorReader from './interfaces/indoorSensorReader'
import OutdoorSensorReader from './interfaces/outdoorSensorReader'

/**
 * Holds all variables describing teh current environment
 */
export interface Environment {
    temperature: number
    humidity: number
    outsideTemperature: number | null
}


/**
 * 
 */
export type EnvironmentListener = (environemt: Environment) => void

/**
 * Gets environment data and buffers data when possible
 */
export class EnvironmentProvider {

    /**
     * The 
     */
    protected listeners: EnvironmentListener[] = []

    /**
     * The update interval in which the sensor data is read and published to the listeners
     */
    protected readonly updateIntervalMS: number

    /**
     * 
     */
    protected _lastRecentEnvironment: Environment | null = null

    /**
     * 
     */
    public get lastRecentEnvironment(): Environment | null {
        return this._lastRecentEnvironment
    }

    /**
     * 
     * @param updateInterval given in seconds
     */
    constructor(updateIntervalMins: number,
                protected indoorSensorReader: IndoorSensorReader,
                protected outsideSensorReader: OutdoorSensorReader) {
        this.updateIntervalMS = updateIntervalMins * 60 * 1000
    }

    /**
     * Returns the environment while eventually using buffered data
     */
    public async getEnvironment(): Promise<Environment> {
        const sensorReading = await this.indoorSensorReader.getEnvironment()
        const outdoorTemperature = await this.outsideSensorReader.getEnvironment()
        // TODO: change this structure to include indoor and outdoor reading without destructuring
        const env = {
            temperature: sensorReading.temperature,
            humidity: sensorReading.humidity,
            outsideTemperature: outdoorTemperature.temperature
        }
        this._lastRecentEnvironment = env
        return env
    }

    /**
     * Reads the current environment in a given interval and publishes it to the all listeners
     */
    protected update = async () => {
        const env = await this.getEnvironment()
        for(const listener of this.listeners) {
            listener(env)
        }
        setTimeout(this.update, this.updateIntervalMS)
    }


    /**
     * Subscribe to enviroment readings
     * @param listener 
     */
    public subscribe(listener: EnvironmentListener): void {
        this.listeners.push(listener)
        if (this.listeners.length === 1) {
            // start the update routine as soon as the first listener is attached
            this.update()
        }
    }
}