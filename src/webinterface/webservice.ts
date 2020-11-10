import { OneTimeOverride } from './../heating/logic/scheduleProvider';
import express, { Response as ExpressResponse, Request } from 'express';
import { Application } from 'express'
import { Server } from 'http'
import { join as joinPath } from 'path'
import { IntelligentHeaterUnit } from '../heating/logic/intelligentHeaterUnit';
import { ScheduleData } from '../heating/settings/scheduleDataType';
import bodyParser from "body-parser";
import { WEB_INTERFACE_PORT } from '../env';

type Response = ExpressResponse<any>

const staticFilesFolder = joinPath(__dirname, '../../', '/static/')
const indexFile = joinPath(staticFilesFolder, 'index.html')

/**
 * 
 */
export default class Webservice {

    public readonly app: Application
    public readonly server: Server

    /**
     * 
     * @param heatingUnit 
     */
    constructor(protected readonly heatingUnit: IntelligentHeaterUnit) {
        const app = express()
        this.app = app
        app.disable('x-powered-by')
        app.use(bodyParser.json())

        // define routes
        app.get('/api/getStatus', (req, res) => this.serveStatus(req, res))
        app.get('/api/getSchedule', (req, res) => this.serveSchedule(req, res))
        app.get('/', (req, res) => this.serveIndex(req, res))
        app.post('/api/setOverride', (req, res) => this.setOverride(req, res))
        app.use(express.static(staticFilesFolder))
        
        // start the server
        this.server = app.listen(WEB_INTERFACE_PORT)
    }

    /**
     * 
     * @param req 
     * @param res 
     */
    public serveIndex(req: Request, res: Response) {
        res.sendFile(indexFile)
    }
    
    /**
     * 
     * @param req 
     * @param res 
     */
    public serveStatus(req: Request, res: Response) {
        const data = {
            heaterEnabled: this.heatingUnit.heaterEnabled,
            environment: this.heatingUnit.environment,
            activeHeatingTarget: this.heatingUnit.activeHeatingTarget,
        }
        res.send(data)
    }

    /**
     * 
     * @param req 
     * @param res 
     */
    public serveSchedule(req: Request, res: Response) {
        const data: ScheduleData = this.heatingUnit.schedule.getSchedule()
        res.send(data)
    }

    /**
     * 
     * @param req 
     * @param res 
     */
    public setOverride(req: Request, res: Response) {
        try {
            const body: any = req.body
            let manualOverride: OneTimeOverride | null = null
            // get command
            if (body.remove) {
                manualOverride = null
            } else {
                manualOverride = {
                    startTime: parseInt(body.startTime),
                    endTime: parseInt(body.endTime),
                    targetTemperature: parseInt(body.targetTemperature)
                }
            }
            // create new schedule object
            const newSchedule: ScheduleData = {
                ...this.heatingUnit.schedule.getSchedule(),
                manualOverride: manualOverride
            }
            this.heatingUnit.schedule.setSchedule(newSchedule)
            res.send('OK')
        } catch(e) {
            //res.sendStatus(500)
            res.send(e)
        }
    }
}
