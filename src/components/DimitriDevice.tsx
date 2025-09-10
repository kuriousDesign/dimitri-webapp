import React from 'react';
import { convertModeToColor, convertModeToString, convertOperatingModeToString, DimitriData, getModeFromState, INPUT_MAP } from '@/types/device';
import InputsComponent from './InputsComponent';

interface DimitriDeviceProps {
  data: DimitriData;
}


const MotorDevice: React.FC<DimitriDeviceProps> = ({ data }) => {
  const mode = getModeFromState(data.loopState);
  const name = "Dimitri";

  const stateTextColor = `text-lg ${convertModeToColor(mode)}`;
  //console.log(stateTextColor);
  return (
    <div className="rounded-lg bg-black text-white p-4 w-100">
      <h1 className="text-2xl font-bold text-gray-400">{name}</h1>
      <h2 className="text-md text-gray-400">Operating Mode: {convertOperatingModeToString(data.operatingMode)}</h2>
      <h2 className={stateTextColor}>State: {convertModeToString(mode)}</h2>
      <h3 className="text-md">Step: {data.loopState}</h3>
      <h3 className="text-md">Clutch Device State: {data.clutchDeviceState}</h3>
      <InputsComponent inputStates={data.inputs} inputItems={INPUT_MAP.size > 0 ? Array.from(INPUT_MAP.values()) : []} />
    </div>
  );
};

export default MotorDevice;