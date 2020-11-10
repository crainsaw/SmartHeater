import { RASPBERRY_REMOTE_SETTINGS } from '../../env'
import HeaterRemoteControl from '../interfaces/heaterRemoteControl'
import { spawnPrc } from '../utils/process'

/**
 * Controls a power plug which communicates on 433mhz
 */
export class Remote433Plug implements HeaterRemoteControl {
    private _enabled = false

    /**
     * 
     */
    public get enabled() {
        return this._enabled
    }

    /**
     * 
     */
    public set enabled(enabled: boolean) {
        this._enabled = enabled
        console.debug("Switching heater to status: " + this._enabled)
        
        const results: string[] = []
        const errors: string[] = []
        // spawn process
        spawnPrc(RASPBERRY_REMOTE_SETTINGS.path, [RASPBERRY_REMOTE_SETTINGS.systemCode, RASPBERRY_REMOTE_SETTINGS.unitCode.toString(), enabled ? '1' : '0'], {
            onData: (data: string) => {
                results.push(data)
            },
            onError: (err: string) => {
                errors.push(err)
            },
            onClose: (code: number) => {
                if (code === 0) {
                    console.log('Switched heater on')
                } else {
                    const errMsg = results.join('\n')
                    throw Error(`Raspberry Remote exited with code ${code} and message: ${errMsg}`)
                }   
            }
        })
    }
}
