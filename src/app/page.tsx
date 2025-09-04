"use client";
import DimitriDevice from "@/components/DimitriDevice";
import MotorDevice from "@/components/MotorDevice";
import { useSerial } from "@/providers/SerialProvider";
import { convertMotorIndexToString } from "@/types/motor";


export default function Page() {
  const { motorData, dimitriData, receivingData } = useSerial();

  if (!receivingData) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold text-gray-400">Bad Data Received</h1>
        <p className="text-gray-400">Please troubleshoot data format from device.</p>
      </main>
    );
  }

  return (
    <main
      className="container mx-auto p-4 space-y-4"
    >
      <DimitriDevice data={dimitriData} />
      <div className="flex flex-row flex-wrap space-x-4 space-y-4">
        {motorData.map((motor, index) => (
          <MotorDevice key={index} motorData={motor} name={convertMotorIndexToString(index)} />
        ))}
      </div>

    </main>
  );
}
