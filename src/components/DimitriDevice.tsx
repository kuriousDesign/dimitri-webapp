import React from 'react';
import { convertModeToColor, convertModeToString, convertOperatingModeToString, DimitriData, getModeFromState } from '@/types/device';

interface DimitriDeviceProps {
  data: DimitriData;
}


const MotorDevice: React.FC<DimitriDeviceProps> = ({ data }) => {
  const mode = getModeFromState(data.loopState);
  const name = "Dimitri";

  const stateTextColor = `text-lg ${convertModeToColor(mode)}`;
  //console.log(stateTextColor);
  return (
    <div className="rounded-lg bg-black text-white p-4 w-64">
      <h1 className="text-2xl font-bold text-gray-400">{name}</h1>
      <h2 className="text-md text-gray-400">Operating Mode: {convertOperatingModeToString(data.operatingMode)}</h2>
      <h2 className={stateTextColor}>State: {convertModeToString(mode)}</h2>
      <h3 className="text-md">Step: {data.loopState}</h3>
    </div>
  );
};

export default MotorDevice;