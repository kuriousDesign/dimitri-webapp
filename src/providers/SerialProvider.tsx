"use client";

import { MOTOR_DATA_SIZE, NUM_MOTORS } from "@/types/types";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from "react";

// Type declarations for Web Serial API (fixes SerialPort and navigator.serial typing)
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
    forget?: () => Promise<void>;  // Optional: For revoking access
  }
}

type SerialContextType = {
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  data: string;
  error?: string;  // Optional: For basic warnings/errors
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

  const connect = async () => {
    try {
      setError(undefined);
      // Request a new port (user selects via browser dialog)
      const selectedPort = await navigator.serial.requestPort({});
      await selectedPort.open({ baudRate: 115200 });  // Adjust baud as needed
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
      }
    }
  };

  const readStream = async (p: SerialPort) => {
    try {
      const reader = p.readable.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let byteBuffer = new Uint8Array();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }

        // Append new data to buffer
        buffer += decoder.decode(value);
        byteBuffer = new Uint8Array([...byteBuffer, ...value]);

        //[STX][LEN][ID][DATA...][ETX][\n]

        // Process complete lines ending with ETX followed by newline
        const totalMsgLength = 1 + 1 + 1 + NUM_MOTORS * MOTOR_DATA_SIZE + 1 + 1;//
        while (buffer.includes('\x03\n') && buffer.length >= totalMsgLength) {
          console.log("Found ETX and newline in buffer");
          const etxNewlineIndex = buffer.indexOf('\x03\n');
          //const newlineIndex = etxNewlineIndex + 1;
          const stxLineIndex = buffer.indexOf('\x02');

          // Update data with complete line

          if (stxLineIndex == 0) {
            console.log("Found STX at beginning of buffer");
   
            const completeLine = buffer.slice(3, etxNewlineIndex);
            
            const expectedLength = byteBuffer[1]
            const id = byteBuffer[2];
            const dataBytes = byteBuffer.slice(3, etxNewlineIndex);
            console.log("first index of dataBytes:", dataBytes[0]);
            console.log("last index of dataBytes: ", dataBytes[dataBytes.length-1]);
 
            console.log("length of dataBytes:", dataBytes.length);

            if (expectedLength == dataBytes.length) {
              if (id == 0) {
                console.log("success");
              } else {
                console.warn("expected id of 0, got:",id);
              }

              setData(completeLine);
            } else {
              console.warn("data length mismatch, expected",expectedLength,"received",dataBytes.length);
            }
          } else {
            console.warn("STX not at beginning of buffer, discarding malformed data");
          }
          // delete data from byteBuffer and buffer before and up to newline
          byteBuffer = byteBuffer.slice(etxNewlineIndex + 2);
          buffer = buffer.slice(etxNewlineIndex + 2);
        }
      }
    } catch (err) {
      setError((err as Error).message || "Stream error");
      disconnect();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [port]);

  return (
    <SerialContext.Provider
      value={{ connected, connect, disconnect, data, error }}
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