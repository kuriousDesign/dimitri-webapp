"use client";

import { MOTOR_DATA_SIZE, NUM_MOTORS, MotorData, convertBytesToMotorData } from "@/types/motor";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from "react";
import { DimitriData, initialDimitriData, PACKET_SIZE } from "@/types/device";

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


export default function SerialProvider({ children }: { children: ReactNode }) {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [data, setData] = useState<string>("");
  const [motorData, setMotorData] = useState<MotorData[]>(
    Array.from({ length: NUM_MOTORS }, () => ({} as MotorData))
  );
  const [dimitriData, setDimitriData] = useState<DimitriData>(initialDimitriData);
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
        if (!value) continue;

        buffer = new Uint8Array([...buffer, ...value]);

        // safety check
        if (buffer.length > 3 * PACKET_SIZE) {
          console.warn("Buffer overflow, clearing ", buffer.length, "bytes");
          buffer = new Uint8Array();
          setReceivingData(false);
          continue;
        }

        while (buffer.length >= 5) { // minimal packet: STX + LEN + ID + ETX + NEWLINE
          const stxIndex = buffer.indexOf(STX);
          if (stxIndex === -1) {
            buffer = new Uint8Array(); // no STX at all
            break;
          }

          // remove any leading garbage bytes
          if (stxIndex > 0) buffer = buffer.slice(stxIndex);

          if (buffer.length < 5) break; // not enough for minimal packet

          const length = buffer[1];
          const fullPacketSize = 1 + 1 + 1 + length + 1 + 1; // STX + LEN + ID + DATA + ETX + NEWLINE

          if (buffer.length < fullPacketSize) break; // wait for more data

          const packet = buffer.slice(0, fullPacketSize);

          if (packet[fullPacketSize - 2] !== ETX || packet[fullPacketSize - 1] !== NEWLINE) {
            // corrupted packet, skip this STX and try next
            buffer = buffer.slice(1);
            continue;
          }

          // packet looks valid
          const id = packet[2] === 0x0F ? 0 : packet[2];
          const rawPayload = packet.slice(3, 3 + length);
          const payload = Array.from(rawPayload).map((b) => (b === 0x0F ? 0 : b));

          if (id === 0 && payload.length === PACKET_SIZE) {
            setReceivingData(true);

            const newMotorData: MotorData[] = [];
            for (let i = 0; i < NUM_MOTORS; i++) {
              const motorBytes = payload.slice(
                i * MOTOR_DATA_SIZE,
                (i + 1) * MOTOR_DATA_SIZE
              );
              newMotorData.push(convertBytesToMotorData(new Uint8Array(motorBytes)));
            }
            setMotorData(newMotorData);

            const loopState =
              payload[NUM_MOTORS * MOTOR_DATA_SIZE] |
              (payload[NUM_MOTORS * MOTOR_DATA_SIZE + 1] << 8);
            const signedLoopState = loopState > 32767 ? loopState - 65536 : loopState;
            const newOperatingMode =
              payload[NUM_MOTORS * MOTOR_DATA_SIZE + 2];

            const newInputs: boolean[] = [];
            for (let i = 0; i < 8; i++) {
              newInputs.push(!!(payload[NUM_MOTORS * MOTOR_DATA_SIZE + 3] & (1 << i)));
            }
            const newClutchDeviceState =
              payload[NUM_MOTORS * MOTOR_DATA_SIZE + 4] |
              (payload[NUM_MOTORS * MOTOR_DATA_SIZE + 5] << 8);

            setDimitriData({ loopState: signedLoopState, operatingMode: newOperatingMode, inputs: newInputs, clutchDeviceState: newClutchDeviceState });
          } else if (payload.length !== PACKET_SIZE) {
            console.warn("Bad serial packet length:", payload.length, "expected:", PACKET_SIZE);
          } else {
            console.warn("unknown serial packet ID:", id);
            setReceivingData(false);
          }

          // remove processed packet
          buffer = buffer.slice(fullPacketSize);
        }
      }
    } catch (err) {
      setError((err as Error).message || "Stream error");
      console.error("Stream error:", err);
      disconnect();
    } finally {
      reader.releaseLock();
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
