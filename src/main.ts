import * as core from '@actions/core'
import {generateReport} from './reporter'
import {ActionParams} from './types'

async function run(): Promise<void> {
  try {
    const token: string = core.getInput('token', {required: true})
    const enterprise: string = core.getInput('enterprise', {required: true})
    const emails: string = core.getInput('emails', {required: true})
    const smtp_host: string = core.getInput('smtp_host', {required: true})
    const smtp_port: number = parseInt(core.getInput('smtp_port', {required: true}))
    const sender: string = core.getInput('sender')
    const subject: string = core.getInput('subject')

    const params: ActionParams = {
      token,
      enterprise,
      emails,
      smtp_host,
      smtp_port,
      sender,
      subject
    }
    await generateReport(params)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
