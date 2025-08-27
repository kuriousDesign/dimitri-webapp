"use client";

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

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }
        
        // Append new data to buffer
        buffer += decoder.decode(value);
        
        // Process complete lines
        while (buffer.includes('\n')) {
          const newlineIndex = buffer.indexOf('\n');
          const completeLine = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          // Update data with complete line
          setData(completeLine);
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