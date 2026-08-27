"use client";

import { useSubmitProduct } from "@/components/submit/SubmitProductProvider";
import { Button, type ButtonProps } from "@/components/ui/Button";

export function SubmitProductButton({
  onOpen,
  onClick,
  ...props
}: ButtonProps & {
  onOpen?: () => void;
}) {
  const { open } = useSubmitProduct();
  return (
    <Button
      {...props}
      type="button"
      onClick={(event) => {
        onOpen?.();
        open();
        onClick?.(event);
      }}
    />
  );
}
