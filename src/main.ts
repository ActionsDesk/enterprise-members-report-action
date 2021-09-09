import * as core from '@actions/core'
import {ActionParams, OutputFormat} from './types'
import {generateReport} from './reporter'

async function run(): Promise<void> {
  try {
    // Get the token and add it as the environment variable in case it wasn't provided this way
    const token: string = core.getInput('token', {required: true})
    process.env['GITHUB_TOKEN'] = token

    // Get the rest of the action params
    const enterprise: string = core.getInput('enterprise', {required: true})
    const formatString: string = core.getInput('format', {required: true})
    const format: OutputFormat = OutputFormat[formatString.toUpperCase() as keyof typeof OutputFormat]
    if (format === undefined) {
      throw new Error(`Invalid format: ${formatString}`)
    }

    const params: ActionParams = {
      enterprise,
      format
    }
    const report = await generateReport(params)
    core.setOutput('data', report)
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

run()
