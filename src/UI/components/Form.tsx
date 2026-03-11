import React, {type ChangeEvent, type MouseEventHandler} from 'react';

interface FormProps {
    fields:Array<string>
    buttonAction:(fieldValues:string[])=>void
}

interface FieldProps {
    name:string
    index:number
    onChange:(key:number, newValue:string)=>void
}

function InputField({name, index, onChange}:FieldProps) {
    return (
        <input placeholder={name}
               onChange={
                    (event)=> {
                        onChange(index, event.target.value);
                    }
               }
        />
    );
}

export default function Form({fields, buttonAction}:FormProps) {

    const [fieldValues, setFieldValues] = React.useState(Array<string>);

    let fieldIndex:number = 0;

    function inputChanged(fieldKey:number, newValue:string) {
        const newFieldValues :Array<string> = fieldValues;
        newFieldValues[fieldKey] = newValue;
        setFieldValues(newFieldValues);
    }

    const inputFields:any = fields.map(
        fieldName=>{
            const fieldKey:number = fieldIndex;
            fieldIndex++;
            return (
                <InputField name={fieldName}
                    index={fieldKey} key={fieldKey}
                    onChange={inputChanged} />
            );
        }
    );

    return (
        <>
            <div style={{display:'flex', justifyContent:'center', flexDirection:"column"}}>
                {inputFields}
            </div>
            <div style={{display:'flex', justifyContent:'center'}}>
                <button style={{width:"50%"}}
                        onClick={()=> {
                            buttonAction(fieldValues);
                        }
                    }>Send</button>
            </div>
        </>


    );
}