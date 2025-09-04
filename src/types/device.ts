import { MOTOR_DATA_SIZE, NUM_MOTORS } from "./motor";

export const DIMITRI_DATA_SIZE = 4; // 2 bytes for loopStep and 1 byte for operation mode and 1 byte for inputs
export const PACKET_SIZE = NUM_MOTORS * MOTOR_DATA_SIZE + DIMITRI_DATA_SIZE; // 2 bytes for loopStep and 1 byte for operation mode

export enum Modes {
    ABORTING = -3,
    KILLED = -2,
    ERROR = -1,
    INACTIVE = 0,
    RESETTING = 50,
    IDLE = 100,
    SHIFTING = 200, // while shifting, the controller is active
    MANUAL = 1100,
    UNKNOWN = 9999
};

export function convertModeToString(mode:Modes) {
    switch (mode) {
        case Modes.ABORTING:
            return "ABORTING";
        case Modes.KILLED:
            return "KILLED";
        case Modes.ERROR:
            return "ERROR";
        case Modes.INACTIVE:
            return "INACTIVE";
        case Modes.RESETTING:
            return "RESETTING";
        case Modes.IDLE:
            return "IDLE";
        case Modes.SHIFTING:
            return "SHIFTING";
        case Modes.MANUAL:
            return "MANUAL";
        default:
            return "UNKNOWN";
    }
}

export function convertModeToColor(mode: Modes) {

    switch (mode) {
        case Modes.ABORTING:
            return "text-red-500";

        case Modes.KILLED:
            return "text-darkred";
        case Modes.ERROR:
            return "text-orange-500";
        case Modes.INACTIVE:
            return "text-gray-500";
        case Modes.RESETTING:
            return "text-blue-500";
        case Modes.IDLE:
            return "text-green-500";
        case Modes.SHIFTING:
            return "text-yellow-500";
        case Modes.MANUAL:
            return "text-purple-500";
        default:
            return "text-black";
    }
}


export function getModeFromState(state:number): Modes {
    let mode = Modes.UNKNOWN;
    switch (state) {
        case -3:
            mode = Modes.ABORTING;
            break;
        case -2:
            mode = Modes.KILLED;
            break;
        case -1:
            mode = Modes.ERROR;
            break;
        case 0:
            mode = Modes.INACTIVE;
            break;
        case 50:
            mode = Modes.RESETTING;
            break;
        case 100:
            mode = Modes.IDLE;
            break;
        case 200:
            mode = Modes.SHIFTING;
            break;
        case 1100:
            mode = Modes.MANUAL;
            break;
        default:
            mode = Modes.UNKNOWN;
    }

    if(mode === Modes.UNKNOWN){
        if(state >=  Modes.SHIFTING && state < Modes.MANUAL){
            mode = Modes.IDLE;
        } else if (state >= Modes.MANUAL) {
            mode = Modes.MANUAL;
        } else if (state >= Modes.RESETTING && state < Modes.IDLE) {
            mode = Modes.RESETTING;
        } else if (state < Modes.RESETTING) {
            console.error(`Unknown state: ${state}`);
            mode = Modes.UNKNOWN;
        }
    }


    return mode;
}

export enum OperatingModes
{
  AUTO = 0,
  MANUAL_CLUTCH_JOGGING = 1,
  MANUAL_LINEAR_P = 2,
  MANUAL_LINEAR_S = 3,
  IO_CHECKOUT = 4,
  MANUAL_CLUTCH_ENGAGE = 5,
  UNKNOWN = 255
};

export function convertOperatingModeToString(mode:OperatingModes) {
    switch (mode) {
        case OperatingModes.AUTO:
            return "AUTO";
        case OperatingModes.MANUAL_CLUTCH_JOGGING:
            return "MANUAL_CLUTCH_JOGGING";
        case OperatingModes.MANUAL_LINEAR_P:
            return "MANUAL_LINEAR_P";
        case OperatingModes.MANUAL_LINEAR_S:
            return "MANUAL_LINEAR_S";
        case OperatingModes.IO_CHECKOUT:
            return "IO_CHECKOUT";
        case OperatingModes.MANUAL_CLUTCH_ENGAGE:
            return "MANUAL_CLUTCH_ENGAGE";
        default:
            return "UNKNOWN";
    }
}

export interface DimitriData {
    loopState: number; // Current state of the main loop
    operatingMode: OperatingModes; // Current operating mode
    inputs: boolean[]; // Bitfield representing the state of various inputs (optional)
}

export const initialDimitriData: DimitriData = {
    loopState: Modes.UNKNOWN,
    operatingMode: OperatingModes.UNKNOWN,
    inputs: Array.from({ length: 8 }, () => false),
  }

export enum Inputs
{
    ShiftDownSw = 0,
    ShiftUpSw = 1,
    ClutchNegLimSw = 2,
    ClutchPosLimSw = 3
};

export interface InputItem {
    name: string;
    labelWhenTrue?: string;
    labelWhenFalse?: string;
    colorWhenTrue?: string;
    colorWhenFalse?: string;
}

export const defaultInputItem: InputItem = {
    name: "input",
    labelWhenTrue: "ON",
    labelWhenFalse: "OFF",
    colorWhenTrue: "bg-green-500",
    colorWhenFalse: "bg-gray-500",
}

export const INPUT_MAP: Map<Inputs, InputItem> = new Map([
    [Inputs.ShiftDownSw, {
        name: "Shift Down Sw",
        labelWhenTrue: defaultInputItem.labelWhenTrue,
        labelWhenFalse: defaultInputItem.labelWhenFalse,
        colorWhenTrue: defaultInputItem.colorWhenTrue,
        colorWhenFalse: defaultInputItem.colorWhenFalse
    }],
    [Inputs.ShiftUpSw, {
        name: "Shift Up Sw",
        labelWhenTrue: defaultInputItem.labelWhenTrue,
        labelWhenFalse: defaultInputItem.labelWhenFalse,
        colorWhenTrue: defaultInputItem.colorWhenTrue,
        colorWhenFalse: defaultInputItem.colorWhenFalse
    }],
    [Inputs.ClutchNegLimSw, {
        name: "Clutch Negative Lim Sw",
        labelWhenTrue: defaultInputItem.labelWhenTrue,
        labelWhenFalse: defaultInputItem.labelWhenFalse,
        colorWhenTrue: defaultInputItem.colorWhenTrue,
        colorWhenFalse: defaultInputItem.colorWhenFalse
    }],
    [Inputs.ClutchPosLimSw, {
        name: "Clutch Positive Lim Sw",
        labelWhenTrue: defaultInputItem.labelWhenTrue,
        labelWhenFalse: defaultInputItem.labelWhenFalse,
        colorWhenTrue: defaultInputItem.colorWhenTrue,
        colorWhenFalse: defaultInputItem.colorWhenFalse
    }]
]);
