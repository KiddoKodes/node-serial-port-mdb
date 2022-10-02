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
        this.ser = new SerialPort({ path: "/dev/ttyACM0", baudRate: 9600 })
    }
    readSerial() {
        // Read data that is available but keep the stream in "paused mode"
        // ser=this.ser
        // this.ser.on('readable', function () {
        //     console.log('Data:'+ser)
        // })

        // Switches the port into "flowing mode"
        this.ser.on('data', function (data) {
            console.log('Data:', data)
            return data
        })

    }
    writeSerial(message) {
        this.ser.write(Buffer.from(Windows1252.encode(message)))
    }
    readBalance() {
        this.writeSerial(READ_ALL_BALANCE)
        this.readSerial()
    }
    enablePeripherals() {
        this.writeSerial(ENABLE_PERIPHERALS)
    }
    disablePeripherals() {
        this.writeSerial(DISABLE_PERIPHERALS)
    }
    clearBalance() {
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
        this.clearBalance()
    }
    stopSerial() {
        this.clearBalance()
        this.disablePeripherals()
        this.ser.close()
    }

}
const instance = new SerialPortInstance()
instance.startSerial()
setTimeout(() => {
    instance.readBalance()
}, 100)
export function disable() {
    instance.disablePeripherals()
}