/**
 * Hand-maintained overrides for team data the lolesports schedule API gets
 * wrong or doesn't have.
 *
 * The schedule is our source of truth for which teams exist right now and
 * what their codes are. But it ships display names with inconsistent casing
 * ("kt Rolster", "BILIBILI GAMING", "NONGSHIM RED FORCE") and obviously
 * doesn't know about historical rebrands or community-known aliases that
 * show up in YouTube titles ("SKT" → "T1", "DWG" → "Dplus KIA").
 *
 * Add an entry here ONLY when:
 *   - lolesports' display name is mis-cased and smart-title-case can't fix it
 *   - a historical name still shows up in YouTube titles you want to match
 *   - a creator-content brand (Los Ratones) needs a canonical mapping
 *
 * Don't add an entry for a team just because lolesports already gets it
 * right — the registry uses the schedule by default.
 */

export interface TeamOverride {
  /** The display name we want users to see — overrides whatever lolesports
   *  returns for this team. Must be unique across the file. */
  canonical: string
  /** All codes/aliases that should map to this team. The lolesports
   *  short code (e.g., "HLE") usually goes here too so the registry
   *  can find the team by either code OR override-known alias. */
  aliases: string[]
}

export const TEAM_OVERRIDES: TeamOverride[] = [
  // ── LCK casing fixes ───────────────────────────────────
  { canonical: 'KT Rolster',          aliases: ['KT Rolster', 'kt Rolster', 'KT'] },
  { canonical: 'Nongshim RedForce',   aliases: ['Nongshim RedForce', 'NONGSHIM RED FORCE', 'NS', 'Nongshim'] },
  { canonical: 'BNK FearX',           aliases: ['BNK FearX', 'BNK FEARX', 'BFX', 'FearX'] },
  { canonical: 'Hanwha Life Esports', aliases: ['Hanwha Life Esports', 'HLE'] },
  { canonical: 'Dplus KIA',           aliases: ['Dplus KIA', 'DPLUS KIA', 'DK', 'DKIA', 'DWG', 'DWG KIA', 'DAMWON', 'DAMWON Gaming'] },
  { canonical: 'OKBRO',               aliases: ['OKBRO', 'OK BRION', 'BRO', 'OK Savings Bank BRION', 'Fredit BRION'] },
  { canonical: 'Kwangdong Freecs',    aliases: ['Kwangdong Freecs', 'KDF'] },
  { canonical: 'T1',                  aliases: ['T1', 'SKT', 'SKT T1', 'SK Telecom T1'] },
  { canonical: 'Gen.G',               aliases: ['Gen.G', 'GenG', 'GEN', 'GENG', 'Gen.G Esports'] },
  { canonical: 'DRX',                 aliases: ['DRX', 'Kiwoom DRX', 'KIWOOM DRX'] },

  // ── LPL casing fixes ───────────────────────────────────
  { canonical: 'Bilibili Gaming',     aliases: ['Bilibili Gaming', 'BILIBILI GAMING', 'BLG', 'BiliBili Gaming'] },
  { canonical: 'Top Esports',         aliases: ['Top Esports', 'TOP ESPORTS', 'TES'] },
  { canonical: 'JD Gaming',           aliases: ['JD Gaming', 'JDG'] },
  { canonical: 'Weibo Gaming',        aliases: ['Weibo Gaming', 'WBG'] },
  { canonical: 'Anyones Legend',      aliases: ['Anyones Legend', "Anyone's Legend", 'AL', 'LNG Esports', 'LNG'] },
  { canonical: 'Ninjas in Pyjamas',   aliases: ['Ninjas in Pyjamas', 'NIP', 'Shenzhen NINJAS IN PYJAMAS'] },

  // ── LCS casing fixes ───────────────────────────────────
  { canonical: 'Cloud9',              aliases: ['Cloud9', 'C9', 'Cloud9 Kia'] },
  { canonical: 'Team Liquid',         aliases: ['Team Liquid', 'TL', 'TLH', 'Team Liquid Honda', 'Team Liquid Alienware'] },
  { canonical: 'Lyon Gaming',         aliases: ['Lyon Gaming', 'Lyon', 'LYON'] },
  { canonical: 'RED Canids',          aliases: ['RED Canids', 'RED Canids Kalunga', 'RED'] },

  // ── EU rebrands & casing ───────────────────────────────
  { canonical: 'Movistar KOI',        aliases: ['Movistar KOI', 'MOVISTAR KOI', 'MKOI', 'KOI', 'MOUZ KOI'] },

  // ── Showmatch / creator brands ──────────────────────────
  { canonical: 'Los Ratones',         aliases: ['Los Ratones', 'LR'] },
]
