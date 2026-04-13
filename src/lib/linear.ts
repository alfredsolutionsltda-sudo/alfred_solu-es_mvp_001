import { LinearClient } from '@linear/sdk'

if (!process.env.LINEAR_API_KEY) {
  console.warn('LINEAR_API_KEY is not defined in environment variables')
}

export const linearClient = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY
})

const TARGET_TEAM_NAME = "Alfred Solutions Brazil | AI Chief Of Staff"

/**
 * Busca o ID do time baseado no nome configurado.
 * Geralmente o Alfred Solutions Brazil | AI Chief Of Staff.
 */
export async function getTargetTeamId() {
  const teams = await linearClient.teams()
  const team = teams.nodes.find(t => t.name === TARGET_TEAM_NAME)
  
  if (!team) {
    console.error(`Team "${TARGET_TEAM_NAME}" not found. Available teams:`, teams.nodes.map(t => t.name))
    // Fallback para o primeiro time se não encontrar o específico (opcional)
    return teams.nodes[0]?.id
  }
  
  return team.id
}

/**
 * Cria uma issue no Linear
 */
export async function createLinearIssue({
  title,
  description,
  labelNames = []
}: {
  title: string
  description: string
  labelNames?: string[]
}) {
  const teamId = await getTargetTeamId()
  
  if (!teamId) {
    throw new Error('No Linear team found to create issue.')
  }

  // Busca labels para garantir que existem ou apenas envia os nomes (Linear cria se tiver permissão ou ignora)
  // Por simplicidade, vamos apenas criar a issue vinculada ao time.
  const response = await linearClient.createIssue({
    teamId,
    title,
    description,
  })

  return response
}

/**
 * Busca issues públicas para o Roadmap
 */
export async function getRoadmapIssues() {
  const teamId = await getTargetTeamId()
  
  if (!teamId) return []

  // Buscamos issues do time. Podemos filtrar por labels se necessário.
  // Por enquanto pegamos as issues abertas ou em progresso.
  const issues = await linearClient.issues({
    filter: {
      team: { id: { eq: teamId } },
      state: { type: { in: ['started', 'unstarted'] } }
    },
    orderBy: 'updatedAt' as any // Usando as any para evitar problemas de tipagem estrita se o SDK mudar
  })

  return issues.nodes
}
