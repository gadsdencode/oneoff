"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-900/95 group-[.toaster]:text-white group-[.toaster]:border-slate-700/50 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-xl",
          description: "group-[.toast]:text-slate-300",
          actionButton:
            "group-[.toast]:bg-violet-600 group-[.toast]:text-white group-[.toast]:hover:bg-violet-700 group-[.toast]:border-0",
          cancelButton:
            "group-[.toast]:bg-slate-700 group-[.toast]:text-slate-200 group-[.toast]:hover:bg-slate-600",
          title: "group-[.toast]:text-white group-[.toast]:font-medium",
          icon: "group-[.toast]:text-violet-400",
        },
        style: {
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(100, 116, 139, 0.3)',
          color: '#ffffff',
        }
      }}
      position="top-right"
      richColors={false}
      {...props}
    />
  )
}

export { Toaster }
