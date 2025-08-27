"use client";
import { useSerial } from "@/providers/SerialProvider";


export default function RawDataPage() {
  const { data } = useSerial();

  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <h1>Raw Serial Data</h1>
      <pre
        style={{
          background: "#f4f4f4",
          padding: "10px",
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          maxHeight: "600px",
        }}
      >
        {data || "No raw data yet..."}
      </pre>
    </main>
  );
}
