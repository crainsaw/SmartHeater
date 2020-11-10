import { IntelligentHeaterUnit } from './heating/logic/intelligentHeaterUnit';
import { EnvironmentProvider } from './environment/environmentProvider';
import HeatTimePredictor from './heating/logic/heatTimePredictor';
import HeaterController from './heating/logic/heaterController';
import TrainingDataProvider from './heating/storage/trainingDataProvider';
import HistoricalDataProvider from './heating/storage/historicalDataProvider';
import Webservice from './webinterface/webservice';
import TrainItemGenerator from './heating/logic/trainItemGenerator';
import { ScheduleProvider } from './heating/logic/scheduleProvider';
import ScheduleDataProvider from './heating/storage/scheduleDataProvider';
import { MQTTTPowerPlug as MQTTPowerPlug } from './environment/services/remoteMQTTPlug';
import DHT22Reader from './environment/services/dht22Reader';
import DummyWheatherAPIReader from './environment/services/dummyWeatherAPIReader';
import { HISTORICAL_STATUS_FILE, HISTORICAL_ENV_FILE, SCHEDULE_DATA_FILE, HEATUP_THRESHOLD, TRAIN_DATA_FILE, UPDATE_INTERVAL_MINS } from './env';
import DummyIndoorReader from './environment/services/dummyIndoorReader';
/*import {test} from './test'
test()*/


// error handling for unhandleled promise rejections
process.on('unhandledRejection', up => { throw up })


// ------------- setup
async function startSystem() {
    console.log('Reading schedule...')
    const scheduleProvider = new ScheduleProvider()
    const schedulePersister = new ScheduleDataProvider(SCHEDULE_DATA_FILE, scheduleProvider)
    await schedulePersister.loadSchedule()

    console.log('Reading training items...')
    const trainDataProvider = new TrainingDataProvider(TRAIN_DATA_FILE)
    await trainDataProvider.loadTrainingData()

    console.log('Initializing...')
    const heatTimePredictor = new HeatTimePredictor(trainDataProvider.trainingData)
    //const indoorSensorReader = new DHT22Reader()
    const indoorSensorReader = new DummyIndoorReader()
    const outdoorSensorReader = new DummyWheatherAPIReader()
    const environmentProvider = new EnvironmentProvider(UPDATE_INTERVAL_MINS, indoorSensorReader, outdoorSensorReader)
    const heaterRemoteControl = new MQTTPowerPlug()
    await heaterRemoteControl.connectToMQTTBroker()
    const heaterController = new HeaterController(HEATUP_THRESHOLD, heaterRemoteControl)
    const heatingUnit = new IntelligentHeaterUnit(environmentProvider, heaterController, heatTimePredictor, scheduleProvider)
    heatingUnit.start()

    console.log('Starting training data collector')
    const trainDataGen = new TrainItemGenerator(heaterController, environmentProvider)
    trainDataGen.addListener((item) => trainDataProvider.addTrainingItem(item))

    console.log("Starting data collector...")
    const dataCollector = new HistoricalDataProvider(HISTORICAL_ENV_FILE, HISTORICAL_STATUS_FILE)
    environmentProvider.subscribe((env) => dataCollector.storeEnvironmentReading(Date.now(), env))
    heaterController.addStatusChangeListener((toggled, enabled, targetTemp) => dataCollector.storeHeaterStatusChange(Date.now(), enabled, targetTemp))

    console.log("Starting webservice...")
    const webservice = new Webservice(heatingUnit)
    const host = webservice.server.address().address
    const port = webservice.server.address().port
    console.log('running at http://' + host + ':' + port)

    console.log("System is up and running.")
}

startSystem()


