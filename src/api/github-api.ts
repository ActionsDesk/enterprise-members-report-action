import type {Octokit} from '@octokit/rest'
import type {GetOrgsResponse, PendingInvite, OrgMember, GetMembersResponse, GetOutsideCollaborators} from '../types'
import {Membership} from '../types'

export async function getOrgsForEnterprise(enterprise: string, octokit: Octokit): Promise<string[]> {
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

export async function getPendingInvitesFromOrgs(orgs: string[], octokit: Octokit): Promise<PendingInvite[]> {
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
        createdAt: invite.created_at
      })
    }
  }
  // Sort them by created_at
  return pendingInvites.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function getMembersFromOrgs(orgs: string[], octokit: Octokit): Promise<OrgMember[]> {
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
                          createdAt
                          emails: organizationVerifiedDomainEmails(login: $org)
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
          members.set(member.login, {...member, orgs: [org], createdAt: member.createdAt, type: Membership.MEMBER})
        }
      }
    }
  }
  return Array.from(members.values())
}

export async function getOutsideCollaborators(enterprise: string, octokit: Octokit): Promise<OrgMember[]> {
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
              edges {
                repositories(first: 100) {
                  nodes {
                    name
                    nameWithOwner
                  }
                }
                node {
                  login
                  email
                  createdAt
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

    const members: OrgMember[] = response.enterprise.ownerInfo.outsideCollaborators.edges.map(item => {
      // Get the unique set of owners from the name of the repos
      const orgs: string[] = Array.from(new Set(item.repositories.nodes.map(node => node.nameWithOwner.split('/')[0])))
      return {
        orgs,
        login: item.node.login,
        emails: [item.node.email],
        createdAt: item.node.createdAt,
        type: Membership.OUTSISE_COLLABORATOR
      }
    })
    collaborators.push(...members)
  }

  return collaborators
}
