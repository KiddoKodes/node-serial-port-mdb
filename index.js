import { SerialPort } from "serialport";
import * as Windows1252 from "windows-1252"
import crypto from "crypto"
// COMMAND DEFINITION
const ENABLE_PERIPHERALS = '{1‡1}E9'
const DISABLE_PERIPHERALS = '{1‡0}E8'
const POLL = "{1 }51"
const READ_ALL_BALANCE = "{1p}A1"

class SerialPortInstance {
    constructor() {
        this.ser = new SerialPort({ path: "/dev/ttyACM0", baudRate: 9600 }).setEncoding('utf8')
        this.balance = ""
    }
    readSerial() {
        // Read data that is available but keep the stream in "paused mode"


        // Switches the port into "flowing mode"
        let readableData = "";
        this.ser.on('data', function (data) {
            console.log('Data:', data)
            readableData = data
        })
        return readableData

    }
    writeSerial(message) {
        this.ser.write(Buffer.from(Windows1252.encode(message)))
    }
    readBalance() {
        this.writeSerial(READ_ALL_BALANCE)
        this.balance = this.readSerial()
        return this.balance
    }
    enablePeripherals() {
        this.writeSerial(ENABLE_PERIPHERALS)
    }
    disablePeripherals() {
        this.writeSerial(DISABLE_PERIPHERALS)
    }
    clearBalance() {
        console.log(this.readBalance())
        const inputString = String(this.readBalance()).split('1')[0]
        const outputString = Buffer.from(String('3180' + inputString), 'utf-8').toString();
        const checksum = crypto.createHash('sha256').update(outputString).digest('base64')
        const reset_cmd = '{1€' + inputString + '}' + checksum
        console.log('rest me', reset_cmd)
        this.writeSerial(reset_cmd)
    }
    startSerial() {
        // this.ser.open()
        this.enablePeripherals()
        // this.clearBalance()
    }
    stopSerial() {
        this.clearBalance()
        this.disablePeripherals()
        this.ser.close()
    }

}
const instance = new SerialPortInstance()
instance.startSerial()
setInterval(() => {
    instance.readBalance()
}, 1000)
export function disable() {
    instance.disablePeripherals()
}
// UPDATE:
// You can register a handler for process.on('exit') and in any other case(SIGINT or unhandled exception) to call process.exit()

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, exitCode) {
    if (options.cleanup) {
        console.log("Cleanup!")
        instance.stopSerial()
    }
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
