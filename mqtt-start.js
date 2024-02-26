const mqtt = require("mqtt");
var child_process = require('child_process');
const process = require('process');
const config = require('./config.json');
const Topic = require('./topicsEnum')
const fs = require('fs')


const writeToLog = (message) => {
    const logMessage = new Date()+ ': '+ message+ '\n';
    if(fs.existsSync('./log.txt')) {
        fs.appendFileSync('./log.txt', logMessage);
    } else {
        fs.writeFileSync('./log.txt',logMessage);
    }
}


const pidFilePath = "./pid"
const pid = process.pid

let pidFileContent;
if(fs.existsSync(pidFilePath)) {
    pidFileContent = fs.readFileSync(pidFilePath)
}

writeToLog('current pid file content: '+ pidFileContent)
if(pidFileContent != undefined) {
    writeToLog('killing pid '+pidFileContent)
    child_process.exec('TASKKILL /F /PID '+pidFileContent, function (error, stdout, stderr) {
        console.log('Killed processes', error, stdout, stderr);
    });
}

pidFileContent = pid.toString();
writeToLog('current pid '+pidFileContent);
fs.writeFileSync(pidFilePath, pidFileContent);


const client = mqtt.connect("mqtt://192.168.70.181:1883");
client.on("connect", () => {
    const topicsToSubscribeTo = [];
    const topics = config.topics;
    Object.keys(topics).forEach(key => {
        const topicConfig = topics[key];
        if (topicConfig.enabled) {
            topicsToSubscribeTo.push(topicConfig.topicName);
        }
    })

    client.subscribe(topicsToSubscribeTo, (err) => {
        if (err) {
            console.log('MQTT client had error', err);
        }
    })
});

client.on("message", (topic, message) => {
    writeToLog('Got message. topic: '+ topic+', message: '+message.toString())
    switch (topic) {
        case Topic.GamingPCDeskGaming: {
            const topicConfig = config.topics.gamingPCEnableDeskGaming;
            loadMonitorConfig(topicConfig.monitorConfigPath);
            loadAudioConfig(topicConfig.audioConfigPath)
        }
            break;
        case Topic.GamingPCProjectorGaming: {
            const topicConfig = config.topics.gamingPCEnableProjectorGaming
            loadMonitorConfig(topicConfig.monitorConfigPath);
            loadAudioConfig(topicConfig.audioConfigPath)
        }
            break;
        case Topic.GamingPCShutdown:
            shutdownPC();
            break;
        case Topic.RecordingPCShutdown:
            shutdownPC();
            break;
    }
});

const loadMonitorConfig = (configFilePath) => {
    writeToLog('loading monitor config file '+configFilePath);
    child_process.exec(`MultiMonitorTool /LoadConfig ${configFilePath}`, function (error, stdout, stderr) {
        console.log(stdout);
    });
}
const loadAudioConfig = (configFilePath) => {
    writeToLog('loading audio config file '+configFilePath);
    child_process.exec(`soundvolumeview /LoadProfile  ${configFilePath}`, function (error, stdout, stderr) {
        console.log(stdout);
    });
}

const shutdownPC = () => {
    writeToLog('shutting down Computer');
    child_process.exec('nirCmd exitwin shutdown', function (error, stdout, stderr) {
        console.log(stdout);
    });
}

