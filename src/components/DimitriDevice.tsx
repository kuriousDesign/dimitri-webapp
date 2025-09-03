import React from 'react';
import { convertModeToColor, convertModeToString, getModeFromState } from '@/types/device';

interface DimitriDeviceProps {
  state: number;
}


const MotorDevice: React.FC<DimitriDeviceProps> = ({ state }) => {
  const mode = getModeFromState(state);
  const name = "Dimitri";

  const stateTextColor = `text-lg ${convertModeToColor(mode)}`;
  //console.log(stateTextColor);
  return (
    <div className="rounded-lg bg-black text-white p-4 w-64">
      <h1 className="text-2xl font-bold text-gray-400">{name}</h1>
      <h2 className={stateTextColor}>{convertModeToString(mode)}</h2>
      <h3 className="text-md">Step: {state}</h3>
    </div>
  );
};

export default MotorDevice;