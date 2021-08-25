import * as CSV from 'csv-string'
import {ActionParams, Membership, OrgMember, OutputFormat, PendingInvite} from './types'
import {
  getMembersFromOrgs,
  getOrgsForEnterprise,
  getOutsideCollaborators,
  getPendingInvitesFromOrgs
} from './api/github-api'
import {Octokit} from '@octokit/rest'
import {getMarkdownTable} from './markdown/markdown-table'
import marked from 'marked'

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
    case OutputFormat.CSV:
      return getCSVFormat(members, outsideCollaborators, pendingInvites)
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
      head: ['Login', 'Emails', 'Orgs', 'Membership', 'Created At'],
      body: [
        ...allMembers
          .sort((a, b) => a.login.localeCompare(b.login))
          .map(item => [
            item.login,
            // Make sure the email only appears once
            Array.from(new Set(item.emails)).join(','),
            item.orgs.join(','),
            item.type.toString(),
            item.createdAt
          ])
      ]
    }
  })

  // Generate the pending invites table
  const pendingInvitesContent = getMarkdownTable({
    table: {
      head: ['Login', 'Email', 'Org', 'Created At'],
      body: [
        ...pendingInvites
          .sort((a, b) => a.login?.localeCompare(b.login || 'No account') || -1) // Sort by login
          .map(item => [item.login || 'No account', item.email || 'No email', item.org, item.createdAt]) // Map invites
      ]
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

function getCSVFormat(
  members: OrgMember[],
  outsideCollaborators: OrgMember[],
  pendingInvites: PendingInvite[]
): string {
  // Map pending invites into org members as CSVs can only have one file
  const pendingInviteMembers: OrgMember[] = pendingInvites.map(item => {
    return {
      login: item.login || 'No account',
      orgs: [item.org],
      emails: item.email ? [item.email] : [],
      createdAt: item.createdAt,
      type: Membership.PENDING_INVITE
    }
  })

  const allMembers = members
    .concat(outsideCollaborators)
    .concat(pendingInviteMembers)
    .sort((a, b) => a.login.localeCompare(b.login))

  const membersContent = [
    ['Login', 'Emails', 'Orgs', 'Membership', 'Created At'],
    ...allMembers.map(item => [
      item.login,
      // Make sure the email only appears once
      [...new Set(item.emails)].join(','),
      item.orgs.join(','),
      item.type.toString(),
      item.createdAt
    ])
  ]

  return CSV.stringify(membersContent)
}
