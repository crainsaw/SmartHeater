import { Environment } from '../../environment/environmentProvider';
import { EnvironmentProvider } from '../../environment/environmentProvider';
import HeaterController from './heaterController';
import { ScheduleProvider, HeatingTarget } from './scheduleProvider';
import HeatTimePredictor from './heatTimePredictor';


/**
 * 
 */
interface HeatingTargetPrediction {
    // the heating target
    target: HeatingTarget
    // the predicted number of minutes needed to heat up to this temperature (based on current environment)
    predictedMins: number
    // the timestamp at which heating needs to start to reach the target temperature at time (as defined in heating target)
    predictedStartTime: number
}

/**
 * Temperature Presets
 */

/**
 * The main component which bundles all functionality
 */
export class IntelligentHeaterUnit {

    protected _environment: Environment | null = null

    public get environment(): Environment | null {
        return this._environment
    }

    protected _activeHeatingTarget: HeatingTargetPrediction | null = null

    public get activeHeatingTarget(): HeatingTargetPrediction | null {
        return this._activeHeatingTarget
    }

    public get heaterEnabled(): boolean {
        return this.heaterController.heaterEnabled
    }

    protected curTargetExpiryTimeout: NodeJS.Timer | null = null

    /**
     * 
     * @param environmentProvider 
     * @param heaterController 
     * @param heatTimePredictor 
     * @param schedule 
     */
    constructor(protected readonly environmentProvider: EnvironmentProvider,
                protected readonly heaterController: HeaterController,
                public readonly heatTimePredictor: HeatTimePredictor,
                public readonly schedule: ScheduleProvider
                ) { }
    
    /**
     * Start controlling the heater based on the schedule
     */
    public start(): void {
        this.environmentProvider.subscribe((env) => this.processNewEnvironment(env))
        this.schedule.subscribeToScheduleChanges(() => this.updateHeaterStatus())
        /**
         * Dont wait for environment provider to publish next package (when we are the first subscriber we dont need this)
         */
        if (this.environmentProvider.lastRecentEnvironment) {
            this.processNewEnvironment(this.environmentProvider.lastRecentEnvironment)
            this.updateHeaterStatus()
        }
    }

    /**
     * 
     * @param env 
     */
    protected processNewEnvironment(env: Environment): void {
        this._environment = env
        this.updateHeaterStatus()
    }

    /**
     * This method need to be called whenever a new env reading is available or when the schedule has been changed
     * @param env 
     */
    protected updateHeaterStatus(): void {
        // clear expiry timeout
        if (this.curTargetExpiryTimeout !== null) {
            clearTimeout(this.curTargetExpiryTimeout)
            this.curTargetExpiryTimeout = null
        }
        // adjust heater
        const targetTemperature = this.calculateTargetTemp()
        const curTemp: number | null = this._environment === null ? null : this._environment.temperature
        this.heaterController.updateCurrentStatus(targetTemperature, curTemp)
        // make sure to update as soon as the current target expires
        if (this._activeHeatingTarget) {
            const expireTime = this._activeHeatingTarget.target.endTime - Date.now()
            this.curTargetExpiryTimeout = setTimeout(() => this.updateHeaterStatus(), expireTime)
        }
    }

    /**
     * 
     * @param env 
     */
    protected calculateTargetTemp(): number {
        const env = this.environment
        const curTime = Date.now()

        // if the sensor does not work make return any value. The heaterController will switch on anyway
        if (env === null) return 21

        // get the temperature targets
        const targets = this.schedule.getHeatingTargets(curTime)

        // cal predictions
        const predictions = this.createPredictions(targets, env, curTime)
        
        // decide which one to activate right now
        const selectedTarget = this.selectTarget(predictions, curTime)
        this._activeHeatingTarget = selectedTarget

        return selectedTarget.target.targetTemperature
    }


    /**
     * 
     * @param predictions 
     * @param curTime 
     */
    protected selectTarget(predictions: HeatingTargetPrediction[], curTime: number): HeatingTargetPrediction {
        if (predictions.length === 0) {
            throw Error('Cannot select from an empty list of predictions.')
        }
        // then select all targets which need to be activated right now
        predictions = predictions.filter((a) => a.predictedStartTime <= curTime)

        // then select the one with the highest priority and then temperature
        // higher priority overrides lower priority
        // higher temperature overrides lower temperature when both items have the same priority
        // (i.e. we accept that we might heat to much before but we want to reach it on time)
        let selectedTarget: HeatingTargetPrediction | null = null
        for (const prediction of predictions) {
            if (selectedTarget === null) {
                selectedTarget = prediction
            } else if (ScheduleProvider.hasHigherPrio(selectedTarget.target, prediction.target)) {
                selectedTarget = prediction
            }
        }
        // we know it will not be null
        return selectedTarget as HeatingTargetPrediction
    }


    /**
     * 
     * @param targets 
     * @param env 
     * @param curTime 
     */
    private createPredictions(targets: HeatingTarget[], env: Environment, curTime: number): HeatingTargetPrediction[] {
        const res: HeatingTargetPrediction[] = []
        for (const target of targets) {
            const prediction = this.heatTimePredictor.calculateHeatTime(target.targetTemperature, env, curTime)
            res.push({
                target: target,
                predictedMins: prediction,
                predictedStartTime: target.startTime - prediction*60*1000
            })
        }
        return res
    }
}