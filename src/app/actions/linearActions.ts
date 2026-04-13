'use server'

import { getRoadmapIssues } from '@/lib/linear'

export async function getRoadmapIssuesAction() {
  try {
    const issues = await getRoadmapIssues()
    
    // Simplificar os dados para o frontend
    const finalIssues = await Promise.all(issues.map(async (issue) => {
      const labels = await issue.labels()
      const state = await issue.state
      return {
        id: issue.id,
        title: issue.title,
        status: state?.name || 'Todo',
        statusType: state?.type || 'unstarted',
        priority: issue.priority,
        priorityLabel: issue.priorityLabel,
        labels: labels.nodes.map(n => n.name),
        updatedAt: issue.updatedAt.toISOString()
      }
    }))

    return { success: true, data: finalIssues }
  } catch (error) {
    console.error('Error fetching roadmap:', error)
    return { success: false, error: 'Não foi possível carregar o roadmap.' }
  }
}
