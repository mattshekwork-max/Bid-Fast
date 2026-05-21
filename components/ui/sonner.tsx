"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <>
      <style jsx global>{`
        @media (max-width: 640px) {
          [data-sonner-toaster] {
            left: 50% !important;
            right: auto !important;
            transform: translateX(-50%);
          }
        }

        [data-description] {
          opacity: 0.95 !important;
          color: rgb(55, 65, 81) !important;
        }
      `}</style>
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
          } as React.CSSProperties
        }
        {...props}
      />
    </>
  )
}

export { Toaster }
