export interface MonitoredChannel {
  name: string
  youtubeChannelId: string
  region: string
}

export const MONITORED_CHANNELS: MonitoredChannel[] = [
  // Co-streamers
  { name: 'Caedrel', youtubeChannelId: 'UCOFiUtKui6-x4T-J7_DgCag', region: 'INT' },
  { name: 'IWDominate', youtubeChannelId: 'UC5GhzRITJQTwhJNCOaBlVYA', region: 'INT' },
  { name: 'LS', youtubeChannelId: 'UCO4_iMqq5S_UCGSuxhd8vrg', region: 'INT' },
  // Official leagues
  { name: 'LCK', youtubeChannelId: 'UCw1DsweY9b2AKGjV4kGJP1A', region: 'KR' },
  { name: 'LEC', youtubeChannelId: 'UCWWZjhmokTbezUQr1kbbEYQ', region: 'EU' },
  { name: 'LCS', youtubeChannelId: 'UCSF_aFGIIIoWY30GVV19TKA', region: 'NA' },
  { name: 'LPL', youtubeChannelId: 'UCG0lGMfwl8EC5SeqjPMtZYg', region: 'CN' },
  { name: 'CBLOL', youtubeChannelId: 'UC48rkTlXjRd6pnqqBkdV0Mw', region: 'BR' },
  // Global
  { name: 'LoL Esports', youtubeChannelId: 'UCvqRdlKsE5Q8mf8YXbdIJLw', region: 'INT' },
]
