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
      if (!value) continue;

      buffer = new Uint8Array([...buffer, ...value]);

      // safety check
      if (buffer.length > 3 * PACKET_SIZE) {
        console.warn("Buffer overflow, clearing");
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
        const payload = packet.slice(3, 3 + length);
        const interpretedPayload = Array.from(payload).map((b) => (b === 0x0F ? 0 : b));

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

          const loopState =
            interpretedPayload[NUM_MOTORS * MOTOR_DATA_SIZE] |
            (interpretedPayload[NUM_MOTORS * MOTOR_DATA_SIZE + 1] << 8);
          const signedLoopState = loopState > 32767 ? loopState - 65536 : loopState;
          const newOperatingMode =
            interpretedPayload[NUM_MOTORS * MOTOR_DATA_SIZE + 2];

          setDimitriData({ loopState: signedLoopState, operatingMode: newOperatingMode });
        } else {
          console.warn("Bad packet or unknown ID:", id);
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
