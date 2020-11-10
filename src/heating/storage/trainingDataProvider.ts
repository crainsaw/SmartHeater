import { TrainingItem } from './../logic/heatTimePredictor';
import { appendFile, createReadStream, existsSync } from 'fs';
import { createInterface as createReadInterface } from 'readline';

/**
 * 
 */
export default class TrainingDataProvider {

    constructor(public dataFile: string) { }

    /**
     * 
     */
    protected trainingItems: TrainingItem[] = []
    

    /**
     * 
     */
    public get trainingData(): TrainingItem[] {
        return this.trainingItems
    }

    /**
     * 
     * @param item 
     */
    public addTrainingItem(item: TrainingItem): void {
        this.trainingItems.push(item)
        this.appendItemToFile(item)
        // TODO: cleanup: Remove duplicates or to similar data
    }

    /**
     * 
     * @param item 
     */
    protected async appendItemToFile(item: TrainingItem): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const itemForStorage: TrainingItem = {
                ...item,
                startTimestamp: Math.floor(item.startTimestamp * 1.0 / 1000)
            }
            appendFile(this.dataFile, JSON.stringify(itemForStorage) + '\n', function (err) {
                if (err) reject(err)
                else resolve()
            })
        })
    }

    /**
     * Loads the training data from the file
     */
    public async loadTrainingData(): Promise<void> {
        if (!existsSync(this.dataFile)) return
        
        return new Promise<void>((resolve, reject) => {
            const result: TrainingItem[] = []
            try {
                createReadInterface({
                    input: createReadStream(this.dataFile)
                }).on('line', (line) => {
                    if (line !== '') {
                        const item: TrainingItem = JSON.parse(line) as TrainingItem
                        item.startTimestamp *= 1000
                        result.push(item)
                    }
                }).on('close', () => {
                    this.trainingItems = result
                    resolve()
                })
            } catch(e) {
                reject(e)
            }
        })
    }
}