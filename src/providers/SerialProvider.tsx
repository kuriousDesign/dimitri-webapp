"use client";

import { MOTOR_DATA_SIZE, NUM_MOTORS, MotorData } from "@/types/motor";
import { convertBytesToMotorData } from "@/lib/SerialHandlers";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from "react";
import { DimitriData, OperatingModes } from "@/types/device";

declare global {
  interface Navigator {
    serial: {
      requestPort: (options?: { filters?: unknown[] }) => Promise<SerialPort>;
      getPorts: () => Promise<SerialPort[]>;
    };
  }

  interface SerialPort {
    open: (options: { baudRate: number }) => Promise<void>;
    close: () => Promise<void>;
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    forget?: () => Promise<void>;
  }
}

type SerialContextType = {
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  data: string;
  motorData: MotorData[];
  dimitriData: DimitriData;
  error?: string;
  receivingData: boolean;
};

const SerialContext = createContext<SerialContextType | null>(null);

const STX = 0x02;
const ETX = 0x03;
const NEWLINE = 0x0A;

const PACKET_SIZE = NUM_MOTORS * MOTOR_DATA_SIZE + 2 + 1; // 2 bytes for loopState and 1 byte for operation mode

export default function SerialProvider({ children }: { children: ReactNode }) {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [data, setData] = useState<string>("");
  const [motorData, setMotorData] = useState<MotorData[]>(
    Array.from({ length: NUM_MOTORS }, () => ({} as MotorData))
  );
  const [dimitriData, setDimitriData] = useState<DimitriData>({
    loopState: 0,
    operatingMode: OperatingModes.UNKNOWN,
  });
  const [receivingData, setReceivingData] = useState(false);

  const connect = async () => {
    try {
      setError(undefined);
      const selectedPort = await navigator.serial.requestPort({});
      await selectedPort.open({ baudRate: 115200 });
      setPort(selectedPort);
      setConnected(true);
      readStream(selectedPort);
    } catch (err) {
      setError((err as Error).message || "Failed to connect");
    }
  };

  const disconnect = async () => {
    if (port) {
      try {
        await port.close();
      } catch (err) {
        setError((err as Error).message || "Failed to disconnect");
      } finally {
        setPort(null);
        setConnected(false);
        setData("");
        setMotorData(Array.from({ length: NUM_MOTORS }, () => ({} as MotorData)));
      }
    }
  };

  const readStream = async (p: SerialPort) => {
    const reader = p.readable.getReader();
    let buffer = new Uint8Array();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer = new Uint8Array([...buffer, ...value]);

          while (true) {
            const stxIndex = buffer.indexOf(STX);
            const etxIndex = buffer.indexOf(ETX, stxIndex + 1);
            const newlineIndex = buffer.indexOf(NEWLINE, etxIndex + 1);

            if (stxIndex === -1 || etxIndex === -1 || newlineIndex !== etxIndex + 1)
              break;

            const packet = buffer.slice(stxIndex, newlineIndex + 1);
            const length = packet[1]; // LEN byte
            const id = packet[2] === 0x0F ? 0 : packet[2];

            const payload = packet.slice(3, 3 + length);

            // Interpret payload bytes as needed
            const interpretedPayload = Array.from(payload).map((b) => (b === 0x0F ? 0 : b));

            //console.log("Packet ID (raw):", id); // <-- This will now correctly show 0 if Arduino sent 0
            //console.log("Interpreted payload:", interpretedPayload);

            if (id === 0 && interpretedPayload.length === PACKET_SIZE) {
              setReceivingData(true);
              const newMotorData: MotorData[] = [];
              for (let i = 0; i < NUM_MOTORS; i++) {
                const motorBytes = interpretedPayload.slice(
                  i * MOTOR_DATA_SIZE,
                  (i + 1) * MOTOR_DATA_SIZE
                );
                newMotorData.push(convertBytesToMotorData(new Uint8Array(motorBytes)));
              }
              setMotorData(newMotorData);
              //console.log("clutch motor state:", newMotorData[0].state);
              // convert last two bytes of payload to be loopState (little-endian)
              const loopState: number = interpretedPayload[NUM_MOTORS * MOTOR_DATA_SIZE] | (interpretedPayload[NUM_MOTORS * MOTOR_DATA_SIZE + 1] << 8);
              // Convert from unsigned to signed int16
              const signedLoopState = loopState > 32767 ? loopState - 65536 : loopState;
              //console.log("New loop state:", signedLoopState);
              const newOperatingMode = interpretedPayload[NUM_MOTORS * MOTOR_DATA_SIZE + 2];
              //console.log("New operating mode:", newOperatingMode);
              // Update dimitriData state

              const newDimitriData = {
                loopState: signedLoopState,
                operatingMode: newOperatingMode, // New operation mode byte
              }

              setDimitriData(newDimitriData);
            } else if(id === 0) {
              console.warn("incorrect payload size:", interpretedPayload.length, "expected:", PACKET_SIZE);
              setReceivingData(false);
            } else {
              console.warn("unknown packet ID:", id);
              setReceivingData(false);
            }

            // Remove processed packet
            buffer = buffer.slice(newlineIndex + 1);
          }
        }
      }
    } catch (err) {
      setError((err as Error).message || "Stream error");
      disconnect();
    } finally {
      reader.releaseLock();
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [port]);

  return (
    <SerialContext.Provider
      value={{ connected, connect, disconnect, data, motorData, error, dimitriData, receivingData }}
    >
      {children}
    </SerialContext.Provider>
  );
}

export const useSerial = () => {
  const context = useContext(SerialContext);
  if (!context) throw new Error("useSerial must be used within SerialProvider");
  return context;
};
