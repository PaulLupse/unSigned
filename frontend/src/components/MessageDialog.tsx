import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "src/components/ui/dialog";
import { Button } from "src/components/ui/button";

/**
 * Shape of an action button rendered in the dialog.
 */
export type DialogAction = {
  label: string;
  action: () => void;
  /**
   * Optional shadcn button variant for semantic styling (e.g. destructive, secondary, outline).
   * Defaults to "default".
   */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
};

export interface DialogContextType {
  /**
   * Imperatively display a dialog.
   * @param text The body message/description to display.
   * @param title The dialog header title.
   * @param actions List of actions displayed as buttons.
   */
  showDialog: (text: string, title: string, actions: DialogAction[]) => void;
  /**
   * Closes the dialog programmatically.
   */
  closeDialog: () => void;
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

interface DialogState {
  isOpen: boolean;
  title: string;
  text: string;
  actions: DialogAction[];
}

const initialDialogState: DialogState = {
  isOpen: false,
  title: "",
  text: "",
  actions: [],
};

interface DialogProps extends DialogState{
  closeDialog:()=>void
}

function DialogComponent({isOpen, title, text, actions, closeDialog}:DialogProps) {
  
  const handleActionClick = (actionFn: () => void) => {
    try {
      actionFn();
    } finally {
      closeDialog();
    }
  };
  
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open:boolean) => {
        if (!open) {
          closeDialog();
        }
      }}
    >
      <DialogContent className="sm:max-w-md bg-background text-foreground border-border">
        <DialogHeader className="space-y-2">
          {title && (
            <DialogTitle className="text-foreground">{title}</DialogTitle>
          )}
          {text && (
            <DialogDescription className="text-muted-foreground whitespace-pre-wrap">
              {text}
            </DialogDescription>
          )}
        </DialogHeader>

        {actions.length > 0 && (
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
            {actions.map((actionItem, index) => (
              <Button
                key={`${actionItem.label}-${index}`}
                variant={actionItem.variant ?? "default"}
                onClick={() => handleActionClick(actionItem.action)}
              >
                {actionItem.label}
              </Button>
            ))}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}


interface DialogProviderProps {
  children: React.ReactNode;
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [dialogState, setDialogState] = React.useState<DialogState>(initialDialogState);

  const closeDialog = React.useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showDialog = React.useCallback(
    (text: string, title: string, actions: DialogAction[]) => {
      setDialogState({
        isOpen: true,
        title,
        text,
        actions: actions && actions.length > 0 ? actions : [{ label: "OK", action: () => {} }],
      });
    },
    []
  );


  return (
    <DialogContext.Provider value={{ showDialog, closeDialog }}>
      {children}
      <DialogComponent closeDialog={closeDialog}
                       isOpen={dialogState.isOpen}
                       title={dialogState.title}
                       text={dialogState.text}
                       actions={dialogState.actions} />
      
    </DialogContext.Provider>
  );
}

/**
 * Hook to access the imperative showDialog method.
 */
export function useDialog(): DialogContextType {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}