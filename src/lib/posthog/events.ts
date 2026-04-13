import { posthog } from './client'

// Onboarding
export const trackOnboardingStep = (step: number, data?: object) =>
  posthog.capture('onboarding_step_completed', { step, ...data })

export const trackOnboardingCompleted = (plan: string) =>
  posthog.capture('onboarding_completed', { plan })

// Contratos
export const trackContractCreated = (serviceType: string, value: number) =>
  posthog.capture('contract_created', { service_type: serviceType, value })

export const trackContractSigned = (contractId: string) =>
  posthog.capture('contract_signed', { contract_id: contractId })

export const trackContractLinkCopied = () =>
  posthog.capture('contract_link_copied')

// Propostas
export const trackProposalCreated = (serviceType: string, value: number) =>
  posthog.capture('proposal_created', { service_type: serviceType, value })

export const trackProposalAccepted = (proposalId: string, value: number) =>
  posthog.capture('proposal_accepted', { proposal_id: proposalId, value })

export const trackProposalRefused = (reason: string) =>
  posthog.capture('proposal_refused', { reason })

// Alfred AI
export const trackAlfredChat = (module: string) =>
  posthog.capture('alfred_chat_used', { module })

export const trackContextRegenerated = () =>
  posthog.capture('alfred_context_regenerated')

// Fiscal
export const trackTaxCalculated = (regime: string, value: number) =>
  posthog.capture('tax_calculated', { regime, value })

export const trackObrigacaoPaid = (obligationType: string) =>
  posthog.capture('obligation_paid', { type: obligationType })

// Clientes
export const trackClientCreated = (clientType: string) =>
  posthog.capture('client_created', { type: clientType })

export const trackCSVImported = (count: number) =>
  posthog.capture('csv_imported', { count })

// Planos
export const trackPlanViewed = (plan: string) =>
  posthog.capture('plan_viewed', { plan })
