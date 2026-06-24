// STUB: Replace with real implementation — see project notes.
// Returns mock bus-factor scores. Will later analyze real Git/Jira/Slack
// authorship + review data to compute concentration and bus factor.

import { DEMO_MODULE_RISK } from './mock-data'
import type { ModuleRisk } from './types'

export async function listModuleRisks(orgId: string): Promise<ModuleRisk[]> {
  void orgId
  return DEMO_MODULE_RISK
}

export async function calculateBusFactor(
  orgId: string,
  moduleId: string,
): Promise<ModuleRisk | null> {
  void orgId
  return DEMO_MODULE_RISK.find((m) => m.id === moduleId) ?? null
}

export interface RiskSummary {
  modulesAtRisk: number
  averageBusFactor: number
  knowledgeConcentrationScore: number
  pendingOffboardingRisks: number
}

export async function getRiskSummary(orgId: string): Promise<RiskSummary> {
  const risks = await listModuleRisks(orgId)
  const modulesAtRisk = risks.filter((m) => m.busFactor <= 2).length
  const averageBusFactor =
    risks.reduce((sum, m) => sum + m.busFactor, 0) / risks.length
  const knowledgeConcentrationScore = Math.round(
    risks.reduce((sum, m) => sum + m.knowledgeConcentration, 0) / risks.length,
  )
  return {
    modulesAtRisk,
    averageBusFactor: Math.round(averageBusFactor * 10) / 10,
    knowledgeConcentrationScore,
    pendingOffboardingRisks: 1,
  }
}
