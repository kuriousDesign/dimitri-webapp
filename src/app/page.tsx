"use client";
import DimitriDevice from "@/components/DimitriDevice";
import MotorDevice from "@/components/MotorDevice";
import { useSerial } from "@/providers/SerialProvider";
import { convertMotorIndexToString } from "@/types/motor";


export default function Page() {
  const { motorData, dimitriState } = useSerial();

  return (
    <main
      className="container mx-auto p-4 space-y-4"
    >
      <DimitriDevice state={dimitriState} />
      <div className="flex flex-row flex-wrap space-x-4 space-y-4">
        {motorData.map((motor, index) => (
          <MotorDevice key={index} motorData={motor} name={convertMotorIndexToString(index)} />
        ))}
      </div>

    </main>
  );
}
