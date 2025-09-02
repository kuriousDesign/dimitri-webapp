import { MotorData } from "@/types/types";

// in need to convert a chunk of bytes (sent from arduino due) into MotorData
export function convertBytesToMotorData(bytes: Uint8Array): MotorData {
  const dataView = new DataView(bytes.buffer);
  return {
    state: dataView.getInt16(0, true),
    actualPosition: dataView.getFloat32(2, true),
    actualVelocity: dataView.getFloat32(6, true),
    targetPosition: dataView.getFloat32(10, true),
  };
}

// i need a function that 
