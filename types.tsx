export interface PluginConfig {
  airtableApiKey: string
  airtableBaseId: string
  config: {
    clientId: string
    supportTableId: string
    clientsTableId: string
    ticketsTableId: string
  }
}

export interface AirtableSupportTeam {
  id: string
  name: string
  email: string
  roles: Array<
    | 'Development'
    | 'Product'
    | 'Stratergy'
    | 'UX & UI'
    | 'Client Services'
    | 'Brand'
  >
  colour:
    | 'gray'
    | 'blue'
    | 'purple'
    | 'magenta'
    | 'red'
    | 'orange'
    | 'yellow'
    | 'green'
    | 'cyan'
  profileImage: string
}

export interface AirtableClientData {
  slackSupport: string
  emailSupport: string
  phoneSupport: string
  accountManager: string
  accountManagerEmail: Array<string>
  targetResponseTime: string
  targetResolutionTime: string
  supportTeamIds: Array<string>
  supportTeam: Array<AirtableSupportTeam> | null
}

export interface ClickUpIssueTypes {
  id: string
  name: string
  color: string
  orderindex: number
}

export interface TicketStatus {
  open: number
  inProgress: number
  blocked: number
  complete: number
}
