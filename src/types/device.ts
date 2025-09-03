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