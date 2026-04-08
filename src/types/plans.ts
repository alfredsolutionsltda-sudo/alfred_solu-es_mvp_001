export type PlanType = 'builder' | 'founder' | 'team' | null

export interface PlanConfig {
  id: PlanType
  name: string
  price: string
  badge: string
  badgeColor: string
  features: string[]
  whopPlanId: string | null
}

export const PLANS: Record<string, PlanConfig> = {
  builder: {
    id: 'builder',
    name: 'Plano Builder',
    price: 'R$ 197',
    badge: 'BUILDER',
    badgeColor: '#1455CE',
    whopPlanId: 'plan_9qGXr34qVl3AL',
    features: [
      'Acesso a todos os módulos do MVP',
      'Contratos, cobranças e impostos',
      'Suporte por e-mail',
    ],
  },
  founder: {
    id: 'founder',
    name: 'Plano Fundador',
    price: 'R$ 397',
    badge: 'FUNDADOR',
    badgeColor: '#D97706',
    whopPlanId: 'plan_SOKfgq0PkSnOl',
    features: [
      'Tudo do Plano Builder',
      'Prioridade no suporte',
      'Acesso antecipado a novas funções',
      'Voto nas próximas features',
      'Badge de Fundador na conta',
    ],
  },
  team: {
    id: 'team',
    name: 'Acesso da Equipe',
    price: 'Interno',
    badge: 'EQUIPE',
    badgeColor: '#1E8A4C',
    whopPlanId: null,
    features: ['Acesso completo', 'Sem restrições'],
  },
}

export function getPlanConfig(plan: PlanType): PlanConfig | null {
  if (!plan) return null
  return PLANS[plan] || null
}

export function isAuthorized(profile: {
  is_authorized: boolean
  plan: PlanType
}): boolean {
  return profile.is_authorized === true && profile.plan !== null
}
