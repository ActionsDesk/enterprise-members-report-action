import * as rest from '@octokit/rest'
import {
  GetOrgsResponse,
  PendingInvite,
  OrgMember,
  GetMembersResponse,
  Membership,
  GetOutsideCollaborators
} from '../types'

export async function getOrgsForEnterprise(enterprise: string, octokit: rest.Octokit): Promise<string[]> {
  let lastPage: string | null | undefined = null
  let hasNextPage = true
  const orgs: string[] = []
  while (hasNextPage) {
    const response: GetOrgsResponse = await octokit.graphql<GetOrgsResponse>(
      `query($enterprise: String!, $page: String) {
        enterprise(slug: $enterprise) {
          organizations(first: 100, after: $page) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              login
            }
          }
        }
      }
    `,
      {
        enterprise,
        page: lastPage
      }
    )

    const orgsData = response.enterprise.organizations
    lastPage = orgsData.pageInfo.endCursor
    hasNextPage = orgsData.pageInfo.hasNextPage
    for (const org of orgsData.nodes) {
      orgs.push(org.login)
    }
  }
  return orgs
}

export async function getPendingInvitesFromOrgs(orgs: string[], octokit: rest.Octokit): Promise<PendingInvite[]> {
  const pendingInvites: PendingInvite[] = []
  for (const org of orgs) {
    const response = await octokit.paginate(octokit.rest.orgs.listPendingInvitations, {
      org
    })
    for (const invite of response) {
      pendingInvites.push({
        org,
        login: invite.login,
        email: invite.email,
        created_at: invite.created_at
      })
    }
  }
  // Sort them by created_at
  return pendingInvites.sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function getMembersFromOrgs(orgs: string[], octokit: rest.Octokit): Promise<OrgMember[]> {
  const members: Map<string, OrgMember> = new Map()
  for (const org of orgs) {
    let lastPage: string | null | undefined
    let hasNextPage = true
    while (hasNextPage) {
      const response: GetMembersResponse = await octokit.graphql<GetMembersResponse>(
        `query($org: String!, $page: String) {
                    organization(login: $org) {
                      members: membersWithRole(first: 100, after: $page) {
                        pageInfo {
                          endCursor
                          hasNextPage
                        }
                        nodes {
                          login
                          email: organizationVerifiedDomainEmails(login: $org)
                        }
                      }
                    }
                  }
                `,
        {
          org,
          page: lastPage
        }
      )
      const membersData = response.organization.members
      lastPage = membersData.pageInfo.endCursor
      hasNextPage = membersData.pageInfo.hasNextPage
      for (const member of membersData.nodes) {
        const existingMember = members.get(member.login)
        if (existingMember) {
          // Only append the email and the org
          for (const email of member.emails) {
            if (existingMember.emails.includes(email)) {
              existingMember.emails.push(email)
            }
          }
          existingMember.orgs.push(org)
        } else {
          // Create a new item
          members.set(member.login, {...member, orgs: [org], type: Membership.MEMBER})
        }
      }
    }
  }
  return Array.from(members.values())
}

export async function getOutsideCollaborators(enterprise: string, octokit: rest.Octokit): Promise<OrgMember[]> {
  const collaborators: OrgMember[] = []
  let lastPage: string | null | undefined = null
  let hasNextPage = true
  while (hasNextPage) {
    const response: GetOutsideCollaborators = await octokit.graphql<GetOutsideCollaborators>(
      `query($enterprise: String!, $lastPage: String) {
        enterprise(slug: $enterprise) {
          ownerInfo {
            outsideCollaborators(last: 100, after: $lastPage) {
              pageInfo {
                endCursor
                hasNextPage
              }
              nodes {
                login
                email
                organizations(first: 100) {
                  nodes {
                    login
                  }
                }
              }
            }
          }
        }
      }`,
      {
        enterprise,
        lastPage
      }
    )

    hasNextPage = response.enterprise.ownerInfo.outsideCollaborators.pageInfo.hasNextPage
    lastPage = response.enterprise.ownerInfo.outsideCollaborators.pageInfo.endCursor

    const members: OrgMember[] = response.enterprise.ownerInfo.outsideCollaborators.nodes.map(item => {
      return {
        orgs: item.organizations.nodes.map(org => org.login),
        login: item.login,
        emails: [item.email],
        type: Membership.OUTSISE_COLLABORATOR
      }
    })
    collaborators.push(...members)
  }

  return collaborators
}

export async function getOutsideCollaborator(orgs: string[], octokit: rest.Octokit): Promise<OrgMember[]> {
  const collaborators: Map<string, OrgMember> = new Map()
  for (const org of orgs) {
    const data = await octokit.paginate(octokit.rest.orgs.listOutsideCollaborators, {
      org
    })
    for (const collaborator of data) {
      if (collaborator !== null) {
        const existingCollaborator = collaborators.get(collaborator.login)
        if (existingCollaborator) {
          existingCollaborator.orgs.push(org)
        } else {
          collaborators.set(collaborator.login, {
            login: collaborator.login,
            emails: [],
            orgs: [org],
            type: Membership.OUTSISE_COLLABORATOR
          })
        }
      }
    }
  }
  return Array.from(collaborators.values())
}
