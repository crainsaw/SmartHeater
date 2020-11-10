import HeaterRemoteControl from "../../environment/interfaces/heaterRemoteControl"

/**
 * 
 */
export type StatusChangeListener = (enabledToggled: boolean, enabled: boolean, targetTemperature: number) => void

/**
 * Makes sure a desired room temperature is maintained
 */
export default class HeaterController {

    /**
     * The most recent temperature reading
     */
    protected curTemperature: number | null = null

    /**
     * The current target temperature. -1 means the heater should be switched off.
     */
    private _targetTemperature = -1

    /**
     * 
     */
    public get heaterEnabled(): boolean {
        return this.heaterRemote.enabled
    }

    /**
     * 
     */
    protected changeListener: StatusChangeListener[] = []


    /**
     * 
     * @param heatupThreshold The temperature difference given in degrees at which the heater will start again to reach the target temperature
     */
    constructor(public readonly heatupThreshold: number, protected readonly heaterRemote: HeaterRemoteControl) { }


    /**
     * Get the currently set target temperature
     */
    public get targetTemperature(): number {
        return this._targetTemperature
    }


    /**
     * Call this whenever a new environment reading is available or when changing the target temperature
     * Sets the current target temperature.
     * Automatically switches the heater off when this temperature is reached and
     * automatically switches back on again when the temperature fell below the target temperature again.
     * @param temperature 
     */
    public updateCurrentStatus(targetTemperature: number, curTemperature: number | null): void {
        const targetTempChanged = this._targetTemperature !== targetTemperature
        this._targetTemperature = targetTemperature
        this.curTemperature = curTemperature

        // update
        const shouldBeEnabled = this.shouldHeat()
        const statusChanged = this.heaterRemote.enabled !== shouldBeEnabled
        
        if (statusChanged) {
            this.heaterRemote.enabled = shouldBeEnabled
        }
        if (statusChanged || targetTempChanged) {
            for (const listener of this.changeListener) {
                listener(statusChanged, shouldBeEnabled, this._targetTemperature)
            }
        }
    }

    /**
     * Decides whether to set the heater on or off
     */
    protected shouldHeat(): boolean {
        if (this._targetTemperature < 0) return false
        if (this.curTemperature === null) return true
        return this._targetTemperature > this.curTemperature - this.heatupThreshold
    }

    /**
     * Call the given listener whenever the heater status or the target temperature changes
     * @param listener 
     */
    public addStatusChangeListener(listener: StatusChangeListener) {
        this.changeListener.push(listener)
    }
}