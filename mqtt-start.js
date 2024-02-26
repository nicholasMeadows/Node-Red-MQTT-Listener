const mqtt = require("mqtt");
var child_process = require('child_process');
const path = require("path");
const config = require('./config.json');

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
    console.log('Got message', topic, message.toString())
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
    child_process.exec(`MultiMonitorTool /LoadConfig ${configFilePath}`, function (error, stdout, stderr) {
        console.log(stdout);
    });
}
const loadAudioConfig = (configFilePath) => {
    child_process.exec(`soundvolumeview /LoadProfile  ${configFilePath}`, function (error, stdout, stderr) {
        console.log(stdout);
    });
}

const shutdownPC = () => {
    child_process.exec('nirCmd exitwin shutdown', function (error, stdout, stderr) {
        console.log(stdout);
    });
}