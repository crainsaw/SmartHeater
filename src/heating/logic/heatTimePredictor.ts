import { Environment } from '../../environment/environmentProvider';
import { NUM_NEAREST_NEIGHBORS } from "../../env";

/**
 * 
 */
export interface TrainingSnapshot {
    minsSinceStart: number
    environment: Environment
}

/**
 * 
 */
export interface TrainingItem {
    /**
     * The timestamp of when the heater was switched on
     */
    startTimestamp: number
    /**
     * Number of minutes the heater was switched on during the last 30 minutes w.r.t. to the startTimestamp
     */
    recentHeaterUsage: number
    /**
     * Stores the number of minutes when an intermediate temeprature result or the final result was reached
     */
    snapshots: TrainingSnapshot[]
}


/**
 * 
 */
export default class HeatTimePredictor {

    constructor(public trainData: TrainingItem[]) { }

    /**
     * Calculates how long it will take to heat up to the given temperature
     * Uses k-nearest neighbors
     * @param targetTemperature 
     * @param currentEnv 
     * @param curTime 
     */
    public calculateHeatTime(targetTemperature: number, currentEnv: Environment, curTime: number | null = null): number {
        if (currentEnv.temperature === targetTemperature) return 0
        if (curTime === null) curTime = Date.now()
        // if we dont have training data return a default value which will start the heater immediately
        if (this.trainData.length === 0) return 24*60*60*1000 * 365 
        
        const scoredTrainData = this.trainData.map((t) => {
            return {
                item: t,
                score: 1.0 / (1 + this.calculateDistance(currentEnv, t))
            }
        })

        // sort by dist
        scoredTrainData.sort((a, b) => b.score - a.score)
        
        // use n nearest neighbors to calculate distance
        const neighbors = scoredTrainData.slice(0, Math.min(NUM_NEAREST_NEIGHBORS, scoredTrainData.length))
        let weightSum = 0
        let predictedTimeMS = 0
        for (const neighbor of neighbors) {
            const weight = neighbor.score
            weightSum += weight
            predictedTimeMS = this.createPrediction(neighbor.item, currentEnv, targetTemperature) * weight
        }
        return Math.ceil(predictedTimeMS * 1.0 / weightSum)
    }

    /**
     * Returns 0 if both are equal.
     * Returns a value greater 0 when trainEnv is colder
     * Returns a value smaller 0 when trainEnv is wamer
     * @param curEnv
     * @param trainEnv 
     */
    protected calculateDistance(curEnv: Environment, trainItem: TrainingItem): number {
        let curDist = 127
        const snapshots = trainItem.snapshots
        for (let i = 0; i < snapshots.length - 1; i++) {
            const snapshot = snapshots[i]
            const snapDist = Math.abs(curEnv.temperature - snapshot.environment.temperature)
            curDist = Math.min(curDist, snapDist)
        }
        return curDist
    }

    /**
     * Returns the predicted number of milliseconds to heat up
     * @param train 
     * @param targetTemp 
     */
    protected createPrediction(train: TrainingItem, curEnv: Environment, targetTemp: number): number {
        if (train.snapshots.length <= 1) throw Error('Invalid training item')
        
        // init
        let startSnapshot: TrainingSnapshot | null = null
        let endSnapshot: TrainingSnapshot | null = null
        // search for the first snapshot that has the same temperature as the current enviroment
        const snapshots = train.snapshots
        let i = 0
        for (; i < snapshots.length; i++) {
            const snapshot = snapshots[i]
            if (snapshot.environment.temperature >= curEnv.temperature) {
                startSnapshot = snapshot
                break
            }
        }
        // if this training item does not contain a snapshot that is at least as hot as the cur enviroment
        // fall back to first one
        startSnapshot = snapshots[0]

        // search for target item or last item if target temp was not reached
        for (i += 1; i < snapshots.length; i++) {
            const snapshot = snapshots[i]
            if (snapshot.environment.temperature >= targetTemp) {
                endSnapshot = snapshot
                break
            }
        }
        // if this training item did not reach the target temperature take the last one
        if (endSnapshot === null) endSnapshot = snapshots[snapshots.length - 1]

        // calculate ratio
        const curEnvTempDiff = Math.abs(targetTemp - curEnv.temperature)

        const trainingTimeDiffSecs = (endSnapshot.minsSinceStart - startSnapshot.minsSinceStart) * 60
        const trainingTempDiff = Math.abs(endSnapshot.environment.temperature- startSnapshot.environment.temperature)
        const timePerHeatup = trainingTimeDiffSecs * 1.0 / trainingTempDiff

        return Math.ceil(curEnvTempDiff * timePerHeatup) * 1000
    }
}