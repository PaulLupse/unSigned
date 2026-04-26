import React, {useEffect, useRef} from 'react'

interface CollapsingDivProps extends React.ComponentPropsWithoutRef<'div'> {
    children:React.ReactNode
}

export default function CollapsingDiv({children, ...props}:CollapsingDivProps) {

    const divRef = useRef<HTMLDivElement>(null);
    useEffect(()=>{

        const wrap = () => {

            const elementChildren:Array<HTMLElement> = Array.from(divRef.current?.children as HTMLCollection) as HTMLElement[];

            if(elementChildren.length === 0) return;

            const firstElement:HTMLElement|undefined = elementChildren[0];

            if(firstElement) {

                const firstElementMidPos = (firstElement.offsetTop + firstElement.offsetHeight)/2;

                for(let child of elementChildren) {
                    const childMidPos = (child.offsetTop + child.offsetHeight)/2;

                    if (childMidPos > firstElementMidPos + firstElement.offsetHeight/2)
                        child.style.display = 'none';
                    else child.style.display = 'flex';
                }
            }
        }

        window.addEventListener('resize', wrap);
        wrap();

        return ()=>{
            divRef.current?.removeEventListener('resize', wrap);
        }
    }, [])

    return (
        <div ref={divRef} {...props}>
            {children}
        </div>
    )
}