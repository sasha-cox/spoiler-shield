const BASE_URL = 'https://esports-api.lolesports.com/persisted/gw'
const API_KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z'

export interface EsportsMatch {
  id: string
  teamA: string
  teamB: string
  eventName: string
  format: 'bo1' | 'bo3' | 'bo5'
  scheduledStart: Date
  status: 'scheduled' | 'live' | 'completed'
}

function parseFormat(bestOf: number): 'bo1' | 'bo3' | 'bo5' {
  if (bestOf === 5) return 'bo5'
  if (bestOf === 3) return 'bo3'
  return 'bo1'
}

export async function getSchedule(): Promise<EsportsMatch[]> {
  try {
    const url = new URL(`${BASE_URL}/getSchedule`)
    url.searchParams.set('hl', 'en-US')

    const res = await fetch(url.toString(), {
      headers: { 'x-api-key': API_KEY },
    })

    if (!res.ok) {
      console.error('Esports API error:', res.status)
      return []
    }

    const data = await res.json()
    const events = data?.data?.schedule?.events ?? []

    return events
      .filter((event: any) => event.type === 'match')
      .map((event: any) => {
        const match = event.match
        const teams = match?.teams ?? []
        return {
          id: event.id ?? match?.id ?? '',
          teamA: teams[0]?.name ?? teams[0]?.code ?? 'TBD',
          teamB: teams[1]?.name ?? teams[1]?.code ?? 'TBD',
          eventName: event.league?.name ?? event.blockName ?? '',
          format: parseFormat(match?.strategy?.count ?? 1),
          scheduledStart: new Date(event.startTime),
          status: (event.state === 'inProgress' ? 'live'
            : event.state === 'completed' ? 'completed'
            : 'scheduled') as EsportsMatch['status'],
        }
      })
  } catch (err) {
    console.error('Esports API fetch failed:', err)
    return []
  }
}
