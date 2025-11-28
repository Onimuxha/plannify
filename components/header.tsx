"use client"
import { LanguageSwitcher } from "./language-switcher"

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <img src="/icon.svg" className="w-9 h-9" alt="Logo" />
          <h1 className="text-xl font-bold">
            Wexly
          </h1>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  )
}
