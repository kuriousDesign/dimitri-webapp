import { defaultInputItem, InputItem } from '@/types/device';
import React from 'react';


export interface InputDivProps {
    state: boolean;
    item: InputItem;
}
export const InputDiv: React.FC<InputDivProps> = ({ state, item }) => {
    const label = state ? item.labelWhenTrue : item.labelWhenFalse;
    const color = state ? item.colorWhenTrue : item.colorWhenFalse;

    return (
        <div key={item.name} className="flex flex-row justify-start items-center text-gray-300">
            <div className={`w-4 h-4  mr-2 rounded-full border-2 ${state ? 'animate-pulse-input border-green-500' : 'border-gray-500'} ${color || (state ? 'bg-green-500' : 'bg-gray-500')}`}></div>
            {item.name}: {label}
        </div>
    );
}

export interface InputsComponentProps {
    inputStates: boolean[];
    inputItems: InputItem[];
}
const InputsComponent: React.FC<InputsComponentProps> = ({ inputStates, inputItems }) => {
    // apply default to any items missing in inputItems, sometimes partial items are passed in so dont overwrite the whole array
    inputItems = inputItems.map(item => ({ ...defaultInputItem, ...item })); //what does this do again?

    return (
        <div className='bg-gray-900 p-1 rounded-sm'>
            <h2 className="text-lg font-bold text-gray-600 mb-2">Inputs</h2>
            {inputItems.map((item, index) => {
                const state = inputStates[index] || false;
                return <InputDiv key={item.name} state={state} item={item} />;
            })}
        </div>
    );
};

export default InputsComponent;