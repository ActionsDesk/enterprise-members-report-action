import * as CSV from 'csv-string'
import {ActionParams, Membership, OrgMember, OutputFormat, PendingInvite, LicenseUsage} from './types'
import {
  getMembersFromOrgs,
  getOrgsForEnterprise,
  getOutsideCollaborators,
  getPendingInvitesFromOrgs
} from './api/github-api'
import {Octokit} from '@octokit/action'
import {getMarkdownTable} from './markdown/markdown-table'
import marked from 'marked'
import parse from 'csv-parse'
import {Readable} from 'stream'

export async function generateReport(params: ActionParams): Promise<string> {
  const octokit = new Octokit()

  const licenseUsage = await loadLicenseUsage(params.licenseUsage)
  const orgs = await getOrgsForEnterprise(params.enterprise, octokit)
  const members = await getMembersFromOrgs(orgs, octokit)
  const outsideCollaborators = await getOutsideCollaborators(params.enterprise, octokit)
  const pendingInvites = await getPendingInvitesFromOrgs(orgs, octokit)
  var licenseColumnTitle = 'License'
  if (params.licenseUsageChanged) {
    licenseColumnTitle = `License (${params.licenseUsageChanged})`
  }

  switch (params.format) {
    case OutputFormat.MARKDOWN:
      return getMarkdownFormat(members, outsideCollaborators, pendingInvites, licenseUsage, licenseColumnTitle)
    case OutputFormat.HTML:
      return getHtmlFormat(members, outsideCollaborators, pendingInvites, licenseUsage, licenseColumnTitle)
    case OutputFormat.JSON:
      return getJSONFormat(members, outsideCollaborators, pendingInvites)
    case OutputFormat.CSV:
      return getCSVFormat(members, outsideCollaborators, pendingInvites, licenseUsage, licenseColumnTitle)
  }
}

function getMarkdownFormat(
  members: OrgMember[],
  outsideCollaborators: OrgMember[],
  pendingInvites: PendingInvite[],
  licenseUsage: LicenseUsage[],
  licenseColumnTitle: string
): string {
  // Generate the members table
  const allMembers = members.concat(outsideCollaborators)
  const membersContent = getMarkdownTable({
    table: {
      head: [
        'Login',
        'Emails',
        'Orgs',
        'Membership',
        'Created At',
        ...(licenseUsage.length !== 0 ? [licenseColumnTitle] : [])
      ],
      body: [
        ...allMembers
          .sort((a, b) => a.login.localeCompare(b.login))
          .map(item => [
            item.login,
            // Make sure the email only appears once
            [...new Set(item.emails)].join(','),
            item.orgs.join(','),
            item.type.toString(),
            item.createdAt,
            ...(licenseUsage.length !== 0 ? [getUserLicense(licenseUsage, item.login, undefined)] : [])
          ])
      ]
    }
  })

  // Generate the pending invites table
  const pendingInvitesContent = getMarkdownTable({
    table: {
      head: ['Login', 'Email', 'Org', 'Created At', ...(licenseUsage.length !== 0 ? [licenseColumnTitle] : [])],
      body: [
        ...pendingInvites
          .sort((a, b) => a.login?.localeCompare(b.login || 'No account') || -1) // Sort by login
          .map(item => [
            // Map invites
            item.login || 'No account',
            item.email || 'No email',
            item.org,
            item.createdAt,
            ...(licenseUsage.length !== 0 ? [getUserLicense(licenseUsage, item.login, item.email)] : [])
          ])
      ]
    }
  })
  return `
## GitHub Report

### Organization members and outside collaborators
${allMembers.length > 0 ? membersContent : '**No members**'}


### Pending invites
${pendingInvites.length > 0 ? pendingInvitesContent : '**No pending invites**'}`
}

function getHtmlFormat(
  members: OrgMember[],
  outsideCollaborators: OrgMember[],
  pendingInvites: PendingInvite[],
  licenseUsage: LicenseUsage[],
  licenseColumnTitle: string
): string {
  return marked(getMarkdownFormat(members, outsideCollaborators, pendingInvites, licenseUsage, licenseColumnTitle))
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
  pendingInvites: PendingInvite[],
  licenseUsage: LicenseUsage[],
  licenseColumnTitle: string
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
    ['Login', 'Emails', 'Orgs', 'Membership', 'Created At', ...(licenseUsage.length !== 0 ? [licenseColumnTitle] : [])],
    ...allMembers.map(item => [
      item.login,
      // Make sure the email only appears once
      [...new Set(item.emails)].join(','),
      item.orgs.join(','),
      item.type.toString(),
      item.createdAt,
      ...(licenseUsage.length !== 0
        ? [getUserLicense(licenseUsage, item.login, [...new Set(item.emails)].join(','))]
        : [])
    ])
  ]

  return CSV.stringify(membersContent)
}

async function loadLicenseUsage(licenseUsageContent?: string): Promise<LicenseUsage[]> {
  const licenseUsage: LicenseUsage[] = []

  if (!licenseUsageContent) {
    return licenseUsage
  }

  const s = new Readable()
  s._read = () => {}
  s.push(licenseUsageContent)
  s.push(null)

  const parser = s.pipe(
    parse({
      from: 2,
      columns: ['name', 'login', 'url', 'license']
    })
  )
  for await (const record of parser) {
    licenseUsage.push(record)
  }

  return licenseUsage
}

function getUserLicense(licenseUsage: LicenseUsage[], login?: string, email?: string): string {
  var license: string = 'No License Found'
  var userLicense: LicenseUsage | undefined

  if (login !== undefined && login != '' && login != 'No account') {
    userLicense = licenseUsage.find(i => i.login === login)
  } else if (email !== undefined && email != '') {
    userLicense = licenseUsage.find(i => i.login.toLowerCase() === email.toLowerCase())
  }

  if (userLicense !== undefined) {
    license = userLicense.license
  }

  return license
}
