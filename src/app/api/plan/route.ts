import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Gets the user's most recent wellness plan
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { data: plan } = await supabase
      .from('wellness_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Get plan error:', error)
    return NextResponse.json({ plan: null })
  }
}
