import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/guards'
import { getRunPodDeformationJob } from '@/lib/deformation/runpod'

type RouteContext = {
  params: {
    id: string
    jobId: string
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin()
    const result = await getRunPodDeformationJob(params.jobId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not read deformation job' },
      { status: 500 },
    )
  }
}

