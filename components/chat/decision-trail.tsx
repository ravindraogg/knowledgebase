'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NODE_STYLES } from '@/lib/node-style'
import type { DecisionTrailStep } from '@/lib/types'

export function DecisionTrail({ steps }: { steps: DecisionTrailStep[] }) {
  return (
    <div className="mb-3 rounded-lg border border-border bg-muted/40 p-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        Decision Trail
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {steps.map((step, i) => {
          const style =
            step.type !== 'event' ? NODE_STYLES[step.type] : null
          const Icon = style?.icon
          return (
            <div key={step.id} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs',
                  style
                    ? cn(style.bg, style.border, style.text)
                    : 'border-border bg-background text-muted-foreground',
                )}
              >
                {Icon ? <Icon className="size-3" /> : null}
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="size-3 text-muted-foreground" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
