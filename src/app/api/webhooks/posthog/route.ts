import { NextRequest, NextResponse } from 'next/server'
import { createBugReport } from '@/lib/linear/client'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // PostHog envia evento $exception
    if (payload.event === '$exception') {
      const errorMessage =
        payload.properties?.$exception_message as string | undefined
      const errorStack =
        payload.properties?.$exception_stack_trace_raw as string | undefined
      const context =
        (payload.properties?.context as string | undefined) ?? 'Unknown'
      const userId = payload.distinct_id as string | undefined

      if (errorMessage) {
        const error = new Error(errorMessage)
        if (errorStack) error.stack = errorStack

        await createBugReport(error, context, userId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (_error) {
    // Sempre retorna 200 para o PostHog não retentar desnecessariamente
    return NextResponse.json({ received: true })
  }
}
