import { EnvironmentProvider, Environment } from '../../environment/environmentProvider';
import { TrainingItem } from './heatTimePredictor';
import HeaterController from './heaterController';


export type TrainItemListener = (item: TrainingItem) => void

/**
 * Creates training items
 */
export default class TrainItemGenerator {

    /**
     * 
     */
    protected listeners: TrainItemListener[] = []

    /**
     * 
     * @param heaterController 
     * @param envReader 
     */
    constructor(heaterController: HeaterController, envReader: EnvironmentProvider) {
        heaterController.addStatusChangeListener((toggled, enabled, targetTemp) => this.heaterListener(toggled, enabled, targetTemp))
        envReader.subscribe((env) => this.envListener(env))
    }

    /**
     * 
     */
    protected curItem: TrainingItem | null = null

    /**
     * 
     * @param enabled 
     * @param targetTemperature 
     */
    protected heaterListener(toggled: boolean, enabled: boolean, targetTemperature: number): void {
        if (!toggled) return
        
        if (enabled === false && this.curItem !== null) {
            if (this.curItem.snapshots.length > 1) {
                this.publishItem(this.curItem)
            }
            this.curItem = null
        }
        if (enabled === true) {
            this.curItem = {
                startTimestamp: Date.now(),
                recentHeaterUsage: -1,
                snapshots: []
            }
        }
    }

    /**
     * 
     * @param environemt 
     */
    protected envListener(environemt: Environment) {
        if (this.curItem !== null) {
            const minsSinceStart = Math.round((Date.now() - this.curItem.startTimestamp) * 1.0 / 1000 / 60)
            this.curItem.snapshots.push({
                minsSinceStart: minsSinceStart,
                environment: environemt
            })
        }
    }


    /**
     * 
     * @param item 
     */
    protected publishItem(item: TrainingItem): void {
        for (const listener of this.listeners) {
            listener(item)
        }
    }
    
    /**
     * 
     * @param listener 
     */
    public addListener(listener: TrainItemListener): void {
        this.listeners.push(listener)
    } 

}