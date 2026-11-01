import React, {createContext, useContext, useEffect, useRef, useState} from "react";
import {Spinner} from "src/components/ui/spinner";
import {Dialog, DialogContent} from "src/components/ui/dialog";


interface LoadingOverlayProps {
    isLoading:boolean
}
export function LoadingOverlay ({isLoading}:LoadingOverlayProps) {

  const ref = useRef<HTMLDialogElement>(null);

  useEffect(()=>{
    if(isLoading) ref.current?.showModal()
    else ref.current?.close()
  }, [isLoading])

  return (
    <Dialog>
      <DialogContent>
        <Spinner />
      </DialogContent>
    </Dialog>
  )
}


export default function Loading() {
  return (
    <div className={'loading'}>
    </div>
  )
}
const LoadingOverlayContext = createContext({
  showLoading: () => {
  }, hideLoading: () => {
  }
})

export function LoadingOverlayProvider({children}: { children: React.ReactNode }) {

    const [loading, setIsLoading] = useState<boolean>(false)

    const showLoading = () => {
      setIsLoading(true)
    }

    const hideLoading = () => {
      setIsLoading(false)
    }

    return (
      <LoadingOverlayContext value={{showLoading, hideLoading}}>
        {children}
        <LoadingOverlay isLoading={loading}/>
      </LoadingOverlayContext>
    )
}

export const useLoading = (): { showLoading: () => void, hideLoading: () => void } => {
  const context = useContext(LoadingOverlayContext)
  if (!context) throw Error("The 'useLoading' hook must be used inside the LoadingOverlay context provider component.")
  return context
}