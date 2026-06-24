import { Box, Diamond, Hexagon, User, type LucideIcon } from 'lucide-react'
import type { NodeType } from './types'

export interface NodeStyle {
  label: string
  icon: LucideIcon
  // tailwind color token name used for text/border accents
  color: string
  bg: string
  border: string
  text: string
  shape: 'circle' | 'square' | 'diamond' | 'hexagon'
}

export const NODE_STYLES: Record<NodeType, NodeStyle> = {
  person: {
    label: 'Person',
    icon: User,
    color: 'var(--node-person)',
    bg: 'bg-node-person/15',
    border: 'border-node-person/50',
    text: 'text-node-person',
    shape: 'circle',
  },
  code: {
    label: 'Code',
    icon: Box,
    color: 'var(--node-code)',
    bg: 'bg-node-code/15',
    border: 'border-node-code/50',
    text: 'text-node-code',
    shape: 'square',
  },
  decision: {
    label: 'Decision',
    icon: Diamond,
    color: 'var(--node-decision)',
    bg: 'bg-node-decision/15',
    border: 'border-node-decision/50',
    text: 'text-node-decision',
    shape: 'diamond',
  },
  work_item: {
    label: 'Work Item',
    icon: Hexagon,
    color: 'var(--node-work)',
    bg: 'bg-node-work/15',
    border: 'border-node-work/50',
    text: 'text-node-work',
    shape: 'hexagon',
  },
}
