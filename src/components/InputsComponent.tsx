import { defaultInputItem, InputItem } from '@/types/device';
import React from 'react';

interface InputsComponentProps {
    inputStates: boolean[];
    inputItems: InputItem[];
}

const InputsComponent: React.FC<InputsComponentProps> = ({ inputStates, inputItems }) => {
    // apply default to any items missing in inputItems, sometimes partial items are passed in so dont overwrite the whole array
    inputItems = inputItems.map(item => ({ ...defaultInputItem, ...item })); //what does this do again?

    return (
        <div className='bg-gray-800 p-1 rounded-sm'>
            <h2 className="text-lg font-bold text-gray-200 mb-2">Inputs</h2>
            {inputItems.map((item, index) => {
                const isActive = inputStates[index] || false;
                const label = isActive ? item.labelWhenTrue : item.labelWhenFalse;
                const color = isActive ? item.colorWhenTrue : item.colorWhenFalse;
                
                return (
                    <div key={item.name} className="flex flex-row justify-start items-center">
                        <div className={`w-4 h-4 mr-2 rounded-full ${color || (isActive ? 'bg-green-500' : 'bg-red-500')}`}></div>
                        {item.name}: {label}
                    </div>
                );
            })}
        </div>
    );
};

export default InputsComponent;