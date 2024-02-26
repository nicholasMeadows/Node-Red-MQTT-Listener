const mqtt = require("mqtt");
var child_process = require('child_process');
const process = require('process');
const config = require('./config.json');
const Topic = require('./topicsEnum')
const fs = require('fs')

const logFilePath = "./log.txt"
const pidFilePath = "./pid";

const writeToLog = (message) => {
    const now = new Date();
    const dateString = `${now.getMonth()+1}-${now.getDate()}-${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
    const logMessage = dateString+ ': '+ message+ '\n';
    if(fs.existsSync(logFilePath)) {
        fs.appendFileSync(logFilePath, logMessage);
    } else {
        fs.writeFileSync(logFilePath,logMessage);
    }
    console.log(logMessage);
}

const killOldProcess = () => {
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
}

const clearOldLogMessages = () => {
    if(!fs.existsSync(logFilePath)) {
        return;
    }
    const removeLogsAfterDays = 2;
    // const removeLogsAfterDaysMilliseconds = removeLogsAfterDays*24*60*60*1000;
    const removeLogsAfterDaysMilliseconds = 2*60*1000;

    const logFileContent = fs.readFileSync(logFilePath, {encoding:'utf-8'});
    const lines = logFileContent.split('\n');

    const now = new Date().getTime();
    let linesToWrite = lines.map(line => {
        const dateString = line.split(': ')[0];
        const date = new Date(dateString);
        const timeMilliseconds = date.getTime();

        if(timeMilliseconds > now - removeLogsAfterDaysMilliseconds) {
            return line;
        }
        return '';
    })
    linesToWrite = linesToWrite.filter(line => line !== '');
    fs.writeFileSync(logFilePath, linesToWrite.join('\n'));    
}

killOldProcess();
clearOldLogMessages();

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

