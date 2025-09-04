// MotorData
// gather motor data and convert into byte chunk, total bytes = int16 (state), float (position), float, float = 14

export const MOTOR_DATA_SIZE = 17;
export const NUM_MOTORS = 3;

export const Motors = {
  CLUTCH: 0,
  LINEAR_P: 1,
  LINEAR_S: 2
};

export function convertMotorIndexToString(index: number): string {
  switch (index) {
    case Motors.CLUTCH:
      return "Clutch";
    case Motors.LINEAR_P:
      return "Linear Primary";
    case Motors.LINEAR_S:
      return "Linear Secondary";
    default:
      return "Unknown Motor";
  }
}

export interface MotorData {
  state: number;
  actualPosition: number;
  actualVelocity: number;
  targetPosition: number;
};

// export const STX = 0x02; // Start of Text
// export const ETX = 0x03; // End of Text
// export const NEW_LINE = 0x0A; // New Line

export enum MotorStates {
  KILLED = -1,
  IDLE = 0,
  MOVING = 2,
  JOGGING = 3,
  HOLD_POSITION = 4,
  STOPPING = 5
};

export function convertMotorStateToString(state: MotorStates) {
  switch (state) {
    case MotorStates.KILLED:
      return "killed";
    case MotorStates.IDLE:
      return "idle";
    case MotorStates.MOVING:
      return "moving";
    case MotorStates.JOGGING:
      return "jogging";
    case MotorStates.HOLD_POSITION:
      return "holding position";
    case MotorStates.STOPPING:
      return "stopping";
  }
}

export function convertMotorStateToColor(state: MotorStates): string {
  switch (state) {
    case MotorStates.KILLED:
      return "text-gray-500";
    case MotorStates.IDLE:
      return "text-white";
    case MotorStates.MOVING:
      return "text-green-500";
    case MotorStates.JOGGING:
      return "text-green-500";
    case MotorStates.HOLD_POSITION:
      return "text-green-500";
    case MotorStates.STOPPING:
      return "text-orange-500";
    default:
      return "text-gray-500";
  }
}
