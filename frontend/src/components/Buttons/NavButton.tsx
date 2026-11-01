import {Button, buttonVariants} from "src/components/ui/button"
import {Link, NavLink, useNavigate} from "react-router-dom";
import type {LucideIcon} from "lucide-react";
import React from "react";
import type {ButtonProps} from "@base-ui/react";
import type {VariantProps} from "class-variance-authority";
import {SidebarMenuButton, sidebarMenuButtonVariants} from "src/components/ui/sidebar";
import {useRender} from "@base-ui/react/use-render";

interface NavButtonProps extends Omit<ButtonProps, "onClick">, VariantProps<typeof buttonVariants> {
  url: string;
  label: string;
  icon?: LucideIcon;
}

export function NavButton({
  url,
  label,
  icon: Icon,
  variant="ghost",
  className = "w-full justify-start gap-3",
  ...props
}: NavButtonProps) {

  return (
    <Button
      variant={variant}
      className={className}
      render={<NavLink to={url} />}
      nativeButton={false}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      {label}
    </Button>
  );
}

interface SidebarMenuNavButtonProps extends Omit<useRender.ComponentProps<"button">, "onClick">, VariantProps<typeof sidebarMenuButtonVariants> {
  url: string;
  label: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
}

export function SidebarMenuNavButton({
  url,
  label,
  icon: Icon,
  variant="default",
  className = "w-full justify-start gap-3",
  ...props
}: SidebarMenuNavButtonProps) {

    return (
        <SidebarMenuButton
            variant={variant}
            className={className}
            render={<Link to={url} />}
            {...props}
        >
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <span>{label}</span>
        </SidebarMenuButton>
    );
}