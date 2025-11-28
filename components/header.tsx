"use client"

import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "./language-switcher"
import { IconCalendar } from "@tabler/icons-react"

export function Header() {
  const { t, language } = useLanguage()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-border-subtle">
            <IconCalendar className="h-5 w-5 text-primary" />
          </div>
          <h1 className={`text-xl font-bold tracking-tight glow-text ${language === "kh" ? "font-khmer" : ""}`}>
            {t.title}
          </h1>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  )
}
