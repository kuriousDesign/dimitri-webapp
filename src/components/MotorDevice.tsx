import React from 'react';

import { MotorData, convertMotorStateToColor, convertMotorStateToString } from '@/types/motor';

interface MotorDeviceProps {
    motorData: MotorData;
    name: string;
}


const MotorDevice: React.FC<MotorDeviceProps> = ({ motorData, name }) => {
    const stateTextColor = `text-lg ${convertMotorStateToColor(motorData.state)}`;
    //console.log(stateTextColor);
    return (
      <div className="rounded-lg bg-black text-white p-4 w-64 h-44">
        <h1 className="text-2xl font-bold text-gray-400">{name}</h1>
        <h2 className={stateTextColor}>{convertMotorStateToString(motorData.state)}</h2>
        <h3 className="text-md">Position: {motorData.actualPosition}</h3>
        <h3 className="text-md">Target: {motorData.targetPosition}</h3>
        <h3 className="text-md">Velocity: {motorData.actualVelocity}</h3>
      </div>
    );
};

export default MotorDevice;