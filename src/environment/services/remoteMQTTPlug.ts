import HeaterRemoteControl from "../interfaces/heaterRemoteControl";
import * as mqtt from 'mqtt'
import { SHELLY_MQTT } from "../../env";




export class MQTTTPowerPlug implements HeaterRemoteControl {
    protected _heaterEnabled: boolean = false

    protected mqttClient: mqtt.Client | null = null


    /**
     * Connects to the MQTT Broker
     */
    public connectToMQTTBroker(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.mqttClient  = mqtt.connect(`mqtt://${SHELLY_MQTT.mqttBrokerAddress}`)

            this.mqttClient.on('connect', () => {
                resolve()
            })

            this.mqttClient.on('error', (err) => {
                reject(err)
            })
        })
    }

    /**
     * 
     * @param msg 
     */
    protected sendCommandToShelly(msg: string): void {
        if (this.mqttClient === null) throw Error('Not connected. Call connectToMQTTBroker() first.')
        this.mqttClient.publish(SHELLY_MQTT.commandTopic, msg)
    }

    /**
     * 
     */
    public get enabled(): boolean {
        return this._heaterEnabled
    }

    /**
     * 
     */
    public set enabled(enabled: boolean) {
        this.sendCommandToShelly(enabled ? 'on' : 'off')
        this._heaterEnabled = enabled
    }
}