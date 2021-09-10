import * as core from '@actions/core'
import {ActionParams, OutputFormat} from './types'
import {generateReport} from './reporter'

async function run(): Promise<void> {
  try {
    // @octokit/auth-action will read the token from either the environment variable GITHUB_TOKEN if set
    // or from the parameter named token. It should only be specified in one place.
    // See https://github.com/octokit/auth-action.js#createactionauth for details.

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
