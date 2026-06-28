import type { DeformationJobInput, DeformationJobOutput, DeformationJobStatus, DeformationProposal } from './types'
import { validateDeformationProposal } from './surface-validation'

type RunPodStartResponse = {
  id?: string
  status?: string
  output?: unknown
  error?: string
}

type RunPodStatusResponse = {
  id?: string
  status?: string
  output?: unknown
  error?: string
}

export type RunPodJobStart = {
  jobId: string
  status: DeformationJobStatus | string
}

export type RunPodJobResult = {
  jobId: string
  status: DeformationJobStatus | string
  output?: DeformationJobOutput
  error?: string
}

export function hasRunPodDeformationConfig() {
  return !!process.env.RUNPOD_DEFORMATION_ENDPOINT_ID && !!process.env.RUNPOD_API_KEY
}

export async function startRunPodDeformationJob(input: DeformationJobInput): Promise<RunPodJobStart> {
  const { endpointId, apiKey } = getRunPodConfig()
  const response = await fetch(`https://api.runpod.ai/v2/${endpointId}/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        ...input,
        workerVersion: process.env.DEFORMATION_WORKER_VERSION || 'local-dev',
      },
    }),
    cache: 'no-store',
  })

  const payload = await readJson<RunPodStartResponse>(response)
  if (!response.ok || payload.error) {
    throw new Error(payload.error || `RunPod start failed with ${response.status}`)
  }

  if (payload.output) {
    return {
      jobId: payload.id || 'runsync',
      status: 'COMPLETED',
    }
  }

  if (!payload.id) {
    throw new Error('RunPod did not return a job id')
  }

  return {
    jobId: payload.id,
    status: payload.status || 'IN_QUEUE',
  }
}

export async function getRunPodDeformationJob(jobId: string): Promise<RunPodJobResult> {
  const { endpointId, apiKey } = getRunPodConfig()
  const response = await fetch(`https://api.runpod.ai/v2/${endpointId}/status/${jobId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  const payload = await readJson<RunPodStatusResponse>(response)
  if (!response.ok || payload.error) {
    return {
      jobId,
      status: 'FAILED',
      error: payload.error || `RunPod status failed with ${response.status}`,
    }
  }

  return {
    jobId: payload.id || jobId,
    status: payload.status || 'IN_PROGRESS',
    output: payload.output ? normalizeWorkerOutput(payload.output) : undefined,
  }
}

export function normalizeWorkerOutput(output: unknown): DeformationJobOutput {
  const raw = output as { proposals?: unknown }
  const proposals = Array.isArray(raw?.proposals) ? raw.proposals : []
  const normalized = proposals.map(normalizeProposal)

  if (normalized.length === 0) {
    throw new Error('Worker did not return deformation proposals')
  }

  const invalid = normalized
    .map((proposal, index) => ({ proposal, index, validation: validateDeformationProposal(proposal) }))
    .filter(item => !item.validation.ok)

  if (invalid.length > 0) {
    throw new Error(
      invalid
        .map(item => `Proposal ${item.index + 1}: ${item.validation.errors.join('; ')}`)
        .join(' | '),
    )
  }

  return { proposals: normalized }
}

function getRunPodConfig() {
  const endpointId = process.env.RUNPOD_DEFORMATION_ENDPOINT_ID
  const apiKey = process.env.RUNPOD_API_KEY

  if (!endpointId || !apiKey) {
    throw new Error('RunPod deformation config is missing')
  }

  return { endpointId, apiKey }
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return await response.json()
  } catch {
    return {} as T
  }
}

function normalizeProposal(value: unknown): DeformationProposal {
  const proposal = value as DeformationProposal
  return {
    id: String(proposal.id || proposal.intensity || 'proposal'),
    label: String(proposal.label || proposal.intensity || 'Propuesta'),
    intensity: proposal.intensity || 'balanced',
    gridSize: proposal.gridSize,
    meshPoints: proposal.meshPoints || [],
    confidence: Number(proposal.confidence ?? 0),
    warnings: Array.isArray(proposal.warnings) ? proposal.warnings.map(String) : [],
    source: String(proposal.source || 'runpod-depth-normal-v1'),
    workerVersion: proposal.workerVersion ? String(proposal.workerVersion) : undefined,
    debugPreviewUrl: proposal.debugPreviewUrl ? String(proposal.debugPreviewUrl) : null,
  }
}

