import {Octokit} from '@octokit/rest'
import marked from 'marked'
import {
  getMembersFromOrgs,
  getOrgsForEnterprise,
  getOutsideCollaborators,
  getPendingInvitesFromOrgs
} from './api/github-api'
import {getMarkdownTable} from './markdown/markdown-table'
import {ActionParams, OutputFormat, OrgMember, PendingInvite} from './types'

export async function generateReport(params: ActionParams): Promise<string> {
  const octokit = new Octokit({
    auth: params.token
  })

  const orgs = await getOrgsForEnterprise(params.enterprise, octokit)
  const members = await getMembersFromOrgs(orgs, octokit)
  const outsideCollaborators = await getOutsideCollaborators(params.enterprise, octokit)
  const pendingInvites = await getPendingInvitesFromOrgs(orgs, octokit)

  switch (params.format) {
    case OutputFormat.MARKDOWN:
      return getMarkdownFormat(members, outsideCollaborators, pendingInvites)
    case OutputFormat.HTML:
      return getHtmlFormat(members, outsideCollaborators, pendingInvites)
    case OutputFormat.JSON:
      return getJSONFormat(members, outsideCollaborators, pendingInvites)
  }
}

function getMarkdownFormat(
  members: OrgMember[],
  outsideCollaborators: OrgMember[],
  pendingInvites: PendingInvite[]
): string {
  // Generate the members table
  const allMembers = members.concat(outsideCollaborators)
  const membersContent = getMarkdownTable({
    table: {
      head: ['Login', 'Emails', 'Orgs', 'Membership'],
      body: [...allMembers.map(item => [item.login, item.emails.join(','), item.orgs.join(','), item.type.toString()])]
    }
  })

  // Generate the pending invites table
  const pendingInvitesContent = getMarkdownTable({
    table: {
      head: ['Login', 'Email', 'Org', 'Created At'],
      body: [...pendingInvites.map(item => [item.login || 'Not registered', item.email, item.org, item.created_at])]
    }
  })
  return `
  ## GitHub Report

  ### Organization members and outside collaborators
  ${allMembers.length > 0 ? membersContent : '**No members**'}


  ### Pending invites
  ${pendingInvites.length > 0 ? pendingInvitesContent : '**No pending invites**'}
  `
}

function getHtmlFormat(
  members: OrgMember[],
  outsideCollaborators: OrgMember[],
  pendingInvites: PendingInvite[]
): string {
  return marked(getMarkdownFormat(members, outsideCollaborators, pendingInvites))
}

function getJSONFormat(
  members: OrgMember[],
  outsideCollaborators: OrgMember[],
  pendingInvites: PendingInvite[]
): string {
  return JSON.stringify({
    members,
    outsideCollaborators,
    pendingInvites
  })
}
