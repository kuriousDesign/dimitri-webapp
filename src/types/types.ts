// MotorData
// gather motor data and convert into byte chunk, total bytes = int16 (state), float (position), float, float = 14

export const MOTOR_DATA_SIZE = 14;
export const NUM_MOTORS = 3;

export enum Motors {
    CLUTCH = 0,
    LINEAR_P = 1,
    LINEAR_S = 2
}

export const STX = 0x02; // Start of Text
export const ETX = 0x03; // End of Text
export const NEW_LINE = 0x0A; // New Line

export interface MotorData {
  state: number;
  actualPosition: number;
  actualVelocity: number;
  targetPosition: number;
}