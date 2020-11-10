import { spawn } from 'child_process'

export interface SpawnCallbacks {
    onData?: (outputChunk: string) => void,
    onError?: (outputChunk: string) => void,
    onClose?: (exitCode: number) => void,
}

export function spawnPrc(extFile: string, params: string[], opts: SpawnCallbacks) {
    const prc = spawn(extFile, params)

    //noinspection JSUnresolvedFunction
    prc.stdout.setEncoding('utf8')
    if (opts.onData) {
        // make sure only one line at a time gets emitted
        prc.stdout.on('data', (data: any) => {
            //console.log("RECEIVED: " + data)
            const str:string = data.toString()
            const lines = str.split(/\r?\n/g)
            if (opts.onData) {
                lines.filter(l => l != "").forEach(opts.onData)
            }
        })
        //prc.stdout.on('data', opts.onData)
    }

    prc.stderr.setEncoding('utf8')
    if (opts.onError) {
        prc.stderr.on('data', (data: any) => {
            const str: string = data.toString()
            if (opts.onError) {
                opts.onError(str)
            }
        })
    }
    
    if (opts.onClose) {
        //prc.on('close', opts.onClose)
        prc.on('exit', opts.onClose)
    }
}
