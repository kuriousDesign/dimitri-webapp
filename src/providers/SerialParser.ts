// Import the necessary modules
import { SerialPort } from 'serialport';
import { DelimiterParser } from '@serialport/parser-delimiter';
import { EventEmitter } from 'events';

export interface SerialParserOptions {
    portName: string;
    baudRate?: number;
}

export class SerialParser extends EventEmitter {
    private port: SerialPort;
    private parser: DelimiterParser;
    private readonly STX = Buffer.from([0x02]); // Start of Text
    private readonly ETX = Buffer.from([0x03]); // End of Text
    private readonly NEWLINE = Buffer.from([0x0A]); // Newline
    private readonly packetDelimiter: Buffer;

    constructor(options: SerialParserOptions) {
        super();
        
        this.packetDelimiter = Buffer.concat([this.ETX, this.NEWLINE]);
        
        // Create a new SerialPort instance
        this.port = new SerialPort({ 
            path: options.portName, 
            baudRate: options.baudRate || 115200 
        });

        // Use the DelimiterParser with the custom packet delimiter
        this.parser = this.port.pipe(new DelimiterParser({ delimiter: this.packetDelimiter }));

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Listen for data from the parser
        this.parser.on('data', (data) => {
            // Check if the packet begins with STX
            if (data[0] === this.STX[0]) {
                // Extract the payload by removing the STX, LEN and ID at the beginning
                const payload = data.subarray(3);
                const id = data[2];
                const len = data[1];
                console.log(`received id: ${id} and length: ${len}`);

                // Convert the payload to a string
                const payloadString = payload.toString('utf8');
                
                this.emit('packet', payloadString);
            } else {
                this.emit('malformedPacket', data);
            }
        });

        // Log any errors
        this.port.on('error', (err) => {
            this.emit('error', err);
        });

        this.port.on('open', () => {
            console.log(`Serial port ${this.port.path} opened`);
            this.emit('open');
        });

        this.port.on('close', () => {
            this.emit('close');
        });
    }

    public close(): void {
        if (this.port.isOpen) {
            this.port.close();
        }
    }

    public isOpen(): boolean {
        return this.port.isOpen;
    }
}
