import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "dark"
  | "outline"
  | "coral-outline"
  | "violet"
  | "choice"
  | "icon"
  | "ghost"
  | "backdrop";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  arrow?: boolean;
  arrowIcon?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  unstyled?: boolean;
};

export type ButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps>;

export type ButtonLinkProps = ButtonBaseProps &
  Omit<React.ComponentProps<typeof Link>, keyof ButtonBaseProps | "href"> & {
    href: string;
  };

const commonClasses =
  "group inline-flex min-w-0 items-center justify-center gap-2 font-black transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45";

const sizeClasses: Record<ButtonSize, string> = {
  xs: "min-h-8 rounded-[12px] rounded-br-[5px] px-3 text-[11px]",
  sm: "min-h-10 rounded-[14px] rounded-br-[6px] px-4 text-xs",
  md: "min-h-11 rounded-[16px] rounded-br-[7px] px-5 text-[13px]",
  lg: "min-h-12 rounded-[17px] rounded-br-[8px] px-6 text-sm",
  icon: "h-10 w-10 rounded-[12px] p-0",
};

const arrowTileClasses: Record<ButtonSize, string> = {
  xs: "h-6 w-6 rounded-[8px] rounded-br-[4px]",
  sm: "h-7 w-7 rounded-[9px] rounded-br-[4px]",
  md: "h-8 w-8 rounded-[11px] rounded-br-[5px]",
  lg: "h-9 w-9 rounded-[12px] rounded-br-[5px]",
  icon: "h-7 w-7 rounded-[9px] rounded-br-[4px]",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border border-coral-dark bg-coral text-white shadow-[2px_2px_0_#d95135] hover:-translate-y-0.5 hover:bg-coral-dark",
  secondary: "border border-ink bg-paper text-ink hover:-translate-y-0.5 hover:bg-paper-strong",
  dark: "border border-ink bg-ink text-white hover:-translate-y-0.5 hover:bg-coral",
  outline: "border border-line bg-paper text-ink hover:border-coral hover:text-coral",
  "coral-outline": "border border-coral bg-paper text-coral hover:bg-coral/5",
  violet: "border border-[#7c5cdb] bg-paper text-[#5f48b6] hover:bg-[#7c5cdb]/5",
  choice: "rounded-[14px] rounded-br-[6px] border border-line bg-paper px-3 py-3 text-sm font-medium text-muted hover:border-coral hover:text-ink",
  icon: "border border-line bg-paper text-muted hover:border-ink hover:bg-paper-strong hover:text-ink",
  ghost: "border border-transparent bg-transparent text-muted hover:bg-paper-strong hover:text-ink",
  backdrop: "absolute inset-0 cursor-default bg-transparent",
};

function getArrowTileClasses(variant: ButtonVariant) {
  if (variant === "primary") return "border border-white/30 bg-white/15 text-white group-hover:bg-white group-hover:text-coral";
  if (variant === "dark") return "border border-white/20 bg-white/10 text-white group-hover:bg-white group-hover:text-ink";
  return "border border-ink/20 bg-paper-strong text-ink group-hover:bg-ink group-hover:text-white";
}

function ButtonContent({
  children,
  icon,
  arrow,
  arrowIcon,
  variant,
  size,
}: Pick<ButtonBaseProps, "children" | "icon" | "arrow" | "arrowIcon" | "variant" | "size">) {
  const resolvedVariant = variant ?? "primary";
  const resolvedSize = size ?? "md";

  return (
    <>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {arrow && (
        <span className={cn("grid shrink-0 place-items-center transition", arrowTileClasses[resolvedSize], getArrowTileClasses(resolvedVariant))}>
          {arrowIcon ?? <ArrowUpRight size={15} strokeWidth={2.5} />}
        </span>
      )}
    </>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  arrowIcon,
  icon,
  children,
  className,
  unstyled = false,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={cn(!unstyled && commonClasses, !unstyled && sizeClasses[size], !unstyled && variantClasses[variant], className)}
    >
      <ButtonContent variant={variant} size={size} arrow={arrow} arrowIcon={arrowIcon} icon={icon}>
        {children}
      </ButtonContent>
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  arrow = false,
  arrowIcon,
  icon,
  children,
  className,
  unstyled = false,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      {...props}
      className={cn(!unstyled && commonClasses, !unstyled && sizeClasses[size], !unstyled && variantClasses[variant], className)}
    >
      <ButtonContent variant={variant} size={size} arrow={arrow} arrowIcon={arrowIcon} icon={icon}>
        {children}
      </ButtonContent>
    </Link>
  );
}
