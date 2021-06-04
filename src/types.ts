// eslint-disable-next-line no-shadow
export enum OutputFormat {
  HTML,
  MARKDOWN,
  JSON
}

export type FormatParams = {
  format: OutputFormat
}

export type ApiParams = {
  token: string
  enterprise: string
}

export type ActionParams = ApiParams & FormatParams

export type OrgLogin = {
  login: string
}

export type PendingInvite = {
  org: string
  login?: string
  email: string
  created_at: string
}

// eslint-disable-next-line no-shadow
export enum Membership {
  MEMBER = 'member',
  OUTSISE_COLLABORATOR = 'outside collaborator'
}

export type OrgMember = {
  orgs: string[]
  login: string
  emails: string[]
  type: Membership
}

type PageInfo = {
  hasNextPage: boolean
  endCursor?: string
}

export type GetOrgsResponse = {
  enterprise: {
    organizations: {
      pageInfo: PageInfo
      nodes: OrgLogin[]
    }
  }
}

export type GetMembersResponse = {
  organization: {
    members: {
      pageInfo: PageInfo
      nodes: [
        {
          login: string
          emails: string[]
        }
      ]
    }
  }
}

export type OutsideCollaboratorRepository = {
  name: string
  nameWithOwner: string
}

export type OutsideCollaborator = {
  repositories: {
    nodes: OutsideCollaboratorRepository[]
  }
  node: {
    login: string
    email: string
  }
}
export type GetOutsideCollaborators = {
  enterprise: {
    ownerInfo: {
      outsideCollaborators: {
        pageInfo: PageInfo
        edges: OutsideCollaborator[]
      }
    }
  }
}
