"use client";

import { useSerial } from "@/providers/SerialProvider";

export default function ConnectionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { connected, connect, error } = useSerial();

  if (!connected) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          textAlign: "center",
        }}
      >
        <h1>Connect to a Serial Device</h1>
        <p>Select and connect to a USB serial port to continue.</p>
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        <button className="bg-black text-white rounded-full h-10 font-bold w-30"
          onClick={connect}

        >
          Connect
        </button>
        <p>
          <small>
            (Browser will prompt for port selection. Previously authorized ports
            may auto-appear.)
          </small>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}