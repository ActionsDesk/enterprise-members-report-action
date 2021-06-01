import {ActionParams} from './types'
import {Octokit} from '@octokit/rest'
import {
  getMembersFromOrgs,
  getOrgsForEnterprise,
  getOutsideCollaborators,
  getPendingInvitesFromOrgs
} from './api/github-api'
import {markdownTable} from 'markdown-table'

export async function generateReport(params: ActionParams): Promise<void> {
  const octokit = new Octokit({
    auth: params.token
  })

  const orgs = await getOrgsForEnterprise(params.enterprise, octokit)
  const members = await getMembersFromOrgs(orgs, octokit)
  const outsideCollaborators = await getOutsideCollaborators(params.enterprise, octokit)
  const pendingInvites = await getPendingInvitesFromOrgs(orgs, octokit)

  // Generate the members table
  const allMembers = members.concat(outsideCollaborators)
  const membersContent = markdownTable([
    ['Login', 'Emails', 'Orgs', 'Membership'],
    ...allMembers.map(item => [item.login, item.emails.join(','), item.orgs.join(','), item.type.toString()])
  ])
  console.log(membersContent)

  // Generate the pending invites table
  const pendingInvitesContent = markdownTable([
    ['Login', 'Email', 'Org', 'Created At'],
    ...pendingInvites.map(item => [item.login || 'Not registered', item.email, item.org, item.created_at])
  ])
  console.log(pendingInvitesContent)

  //TODO send by email
}
