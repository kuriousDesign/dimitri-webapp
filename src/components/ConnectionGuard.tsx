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
        className="absolute  flex flex-col items-center justify-center h-screen w-screen left-1/2 top-1/3 transform -translate-x-1/2 -translate-y-1/2"
      >
        <h1 className="text-2xl font-semibold">Connect to Arduino</h1>
        <p>Click the connect button to show selection prompt</p>
        <p>for your Arduino USB serial port.</p>
        <div className="h-10" />
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        <button className="bg-black text-white rounded-full h-10 font-bold w-30"
          onClick={connect}

        >
          Connect
        </button>

      </div>
    );
  }

  return <>{children}</>;
}