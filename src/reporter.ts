import {Octokit} from '@octokit/rest'
import {getMarkdownTable} from 'markdown-table-ts'
import {
  getMembersFromOrgs,
  getOrgsForEnterprise,
  getOutsideCollaborators,
  getPendingInvitesFromOrgs
} from './api/github-api'
import {ActionParams, EmailParams} from './types'
import nodemailer from 'nodemailer'
import marked from 'marked'

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
  const emailMarkdown = `
  ## GitHub Report

  ### Organization members and outside collaborators
  ${allMembers.length > 0 ? membersContent : '**No members**'}


  ### Pending invites
  ${pendingInvites.length > 0 ? pendingInvitesContent : '**No pending invites**'}
  `

  await sendEmail(params, marked(emailMarkdown))
}

async function sendEmail(params: EmailParams, bodyHtml: string): Promise<void> {
  const info = await nodemailer
    .createTransport({
      host: params.smtp_host,
      port: params.smtp_port,
      secure: false,
      ignoreTLS: true
    })
    .sendMail({
      from: params.sender,
      to: params.emails,
      subject: params.subject,
      html: bodyHtml,
      headers: {
        'Auto-Submitted': 'auto-generated',
        'X-Auto-Response-Suppress': 'All'
      }
    })

  if (info === null) {
    console.error('Error sending email, no message data returned.')
  }
}
