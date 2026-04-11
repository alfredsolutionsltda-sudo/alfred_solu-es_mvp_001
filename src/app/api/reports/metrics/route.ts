import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAlfredBriefingData } from '@/lib/data/reports';
import { ReportPeriod } from '@/types/reports';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') as ReportPeriod) || 'month';
    const userId = session.user.id;

    const data = await getAlfredBriefingData(userId, period);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching report metrics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
