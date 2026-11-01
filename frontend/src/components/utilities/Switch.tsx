import React, {type ReactNode} from "react"


interface SwitchProps<ConditionType> {
    components:{Component:ReactNode, condition:ConditionType}[]
    conditionEvaluator:(switchValue:ConditionType, componentCondition:ConditionType)=>boolean
    switchValue:ConditionType
}
export function Switch<ConditionType>({components, conditionEvaluator, switchValue}:SwitchProps<ConditionType>):ReactNode {
    
    for (let component of components) {
        if (conditionEvaluator(switchValue, component.condition) )
            return component.Component
    }
    return <></>
}