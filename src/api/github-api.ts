import { Octokit } from '@octokit/rest'
import { GetOrgsResponse, PendingInvite, OrgMember, GetMembersResponse } from '../types'

export async function getOrgsForEnterprise(enterprise: string, octokit: Octokit): Promise<Array<string>> {
    var lastPage: string | null | undefined = null
    var hasNextPage = true
    const orgs: string[] = []
    while(hasNextPage){
        const response: GetOrgsResponse = await octokit.graphql<GetOrgsResponse>(`query($enterprise: String!, $page: String) {
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
    `, {
            enterprise,
            page: lastPage
        })

        const orgsData = response.enterprise.organizations;
        lastPage = orgsData.pageInfo.endCursor
        hasNextPage = orgsData.pageInfo.hasNextPage
        orgsData.nodes.forEach((org) => orgs.push(org.login))
    }
    return orgs;
}

export async function getPendingInvitesFromOrgs(orgs: string[], octokit: Octokit): Promise<PendingInvite[]> {
    const pendingInvites: PendingInvite[] = []
    for(const org in orgs) {
        const response = await octokit.paginate(octokit.rest.orgs.listPendingInvitations, {
            org
        })
        response.forEach(invite => {
            pendingInvites.push({
                org,
                login: invite.login,
                email: invite.email,
                created_at: invite.created_at,
            })
        })
    }
    // Sort them by created_at
    return pendingInvites.sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function getMembersFromOrgs(orgs: string[], octokit: Octokit): Promise<OrgMember[]> {
    const members: Map<string, OrgMember> = new Map()
    for(const org in orgs){ 
        var lastPage: string | null | undefined
        var hasNextPage = true
        while(hasNextPage) {
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
                `, {
                    org,
                    page: lastPage
                }
            )
            const membersData = response.organization.members
            lastPage = membersData.pageInfo.endCursor
            hasNextPage = membersData.pageInfo.hasNextPage
            membersData.nodes.forEach((member) => {
                const existingMember = members.get(member.login)
                if(existingMember) {
                    // Only append the email and the org
                    member.emails.forEach(email => {
                        if(existingMember.emails.includes(email)){
                            existingMember.emails.push(email)
                        }
                    });
                    existingMember.orgs.push(org)
                } else {
                    // Create a new item
                    members.set(member.login, {...member, orgs: [org]})
                }
            })
        }
    }
    return Array.from(members.values())
}
