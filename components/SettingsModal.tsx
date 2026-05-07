'use client'

import { useEffect } from 'react'
import { X, RotateCcw } from 'lucide-react'
import { MONITORED_BRANDS } from '@/lib/config'
import { LEAGUES } from '@/lib/leagues'
import { REGIONS } from '@/lib/regions'
import {
  type Preferences,
  toggleBrand,
  toggleLeague,
  toggleRegion,
  resetPreferences,
} from '@/lib/preferences-store'
import { cn } from '@/lib/utils'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  preferences: Preferences
  onChange: (next: Preferences) => void
}

export function SettingsModal({ open, onClose, preferences, onChange }: SettingsModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <button
        type="button"
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-gold/20 bg-[#0d0d0d] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-zinc-800/80 bg-[#0d0d0d]/95 backdrop-blur-sm px-5 py-4">
          <div className="flex flex-col">
            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
              Subscriptions
            </span>
            <h2 id="settings-title" className="font-display text-lg font-bold uppercase tracking-[0.12em] text-white">
              What do you want to see?
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="size-8 grid place-items-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-6">
          <Section
            title="Channels"
            description="Who you want to watch matches via. Caedrel includes every Caedrel sub-channel — you'll never see which one a specific VOD came from."
          >
            <div className="flex flex-wrap gap-2">
              {MONITORED_BRANDS.map((brand) => {
                const hidden = preferences.hiddenBrands.has(brand)
                return (
                  <ToggleChip
                    key={brand}
                    active={!hidden}
                    onClick={() => onChange(toggleBrand(preferences, brand))}
                  >
                    {brand}
                  </ToggleChip>
                )
              })}
            </div>
          </Section>

          <Section
            title="Leagues"
            description="Which competitions show up. Off here = match never appears regardless of channel."
          >
            <div className="flex flex-wrap gap-2">
              {LEAGUES.map((league) => {
                const hidden = preferences.hiddenLeagues.has(league.slug)
                return (
                  <ToggleChip
                    key={league.slug}
                    active={!hidden}
                    onClick={() => onChange(toggleLeague(preferences, league.slug))}
                  >
                    {league.name}
                  </ToggleChip>
                )
              })}
            </div>
          </Section>

          <Section
            title="Regions"
            description="Bulk-mute an entire region without picking each league."
          >
            <div className="flex flex-wrap gap-2">
              {Object.values(REGIONS).map((region) => {
                const hidden = preferences.hiddenRegions.has(region.id)
                return (
                  <ToggleChip
                    key={region.id}
                    active={!hidden}
                    onClick={() => onChange(toggleRegion(preferences, region.id))}
                  >
                    <span aria-hidden className="mr-1">{region.flag}</span>
                    {region.name}
                  </ToggleChip>
                )
              })}
            </div>
          </Section>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-zinc-800/80 bg-[#0d0d0d]/95 backdrop-blur-sm px-5 py-3">
          <button
            type="button"
            onClick={() => onChange(resetPreferences())}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gold px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-black hover:bg-[#e0b84d] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white">
        {title}
      </h3>
      <p className="text-[11px] text-zinc-500 leading-relaxed">{description}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
        active
          ? 'border-gold/60 bg-gold/15 text-gold hover:bg-gold/25'
          : 'border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700',
      )}
    >
      {children}
    </button>
  )
}
