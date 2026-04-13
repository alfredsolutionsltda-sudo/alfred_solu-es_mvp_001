import { LinearClient } from '@linear/sdk'

const linear = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY!,
})

export interface CreateIssueData {
  title: string
  description: string
  priority?: 0 | 1 | 2 | 3 | 4 // 0=none, 1=urgent, 2=high, 3=medium, 4=low
  labelNames?: string[]
}

export async function createLinearIssue(
  data: CreateIssueData
): Promise<string | null> {
  try {
    const teamId = process.env.LINEAR_TEAM_ID!

    if (!teamId) {
      console.error('[Linear] LINEAR_TEAM_ID não configurado')
      return null
    }

    const issue = await linear.createIssue({
      teamId,
      title: data.title,
      description: data.description,
      priority: data.priority ?? 3,
    })

    const createdIssue = await issue.issue
    return createdIssue?.id ?? null
  } catch (error) {
    console.error('[Linear] Erro ao criar issue:', error)
    return null
  }
}

export async function createBugReport(
  error: Error,
  context: string,
  userId?: string
): Promise<void> {
  await createLinearIssue({
    title: `[BUG] ${error.message.slice(0, 80)}`,
    description: `
## Bug Report — Alfred Platform

**Contexto:** ${context}
**Usuário:** ${userId ?? 'Anônimo'}
**Data:** ${new Date().toISOString()}

## Erro
\`\`\`
${error.message}
\`\`\`

## Stack Trace
\`\`\`
${error.stack ?? 'Não disponível'}
\`\`\`
    `.trim(),
    priority: 2, // High
  })
}
