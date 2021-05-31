export type EmailParams = {
    emails: string[]
    smtp_host: string
    smtp_port: string
    sender: string
    subject: string
}

export type ApiParams = {
    token: string
    enterprise: string
}

export type ActionParams = ApiParams | EmailParams

export type OrgLogin = {
    login: string
}

export type PendingInvite = {
    org: string
    login?: string
    email: string
    created_at: string
}

export type OrgMember = {
    orgs: string[]
    login: string,
    emails: string[]
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
            nodes: [{
                login: string
                emails: string[]
            }]
        }
    }
}