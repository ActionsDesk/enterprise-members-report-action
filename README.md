# Email license report action

## Description

This action generates a report for an enterprise with the following elements:
- **Members**: a report of all users that are members of at least one org in the enterprise
- **Outside collaborators**: a compilation of all outside collaborators in all the orgs
- **Pending invites**: the list of all pending invites in all the orgs

## How to

This actions has the following inputs:

| Parameter  | Description                                                                              | Default | Is Required |
|------------|------------------------------------------------------------------------------------------|---------|-------------|
| token      | A personal access token with permissions on all the orgs of the enterprise               | None    | ✅           |
| enterprise | The enterprise where we want to generate the report                                      | None    | ✅           |
| format     | Determines how the output parameter will be formatted. Supports: json, markdown and html | None    | ✅           |

This action has the following outputs:

| Parameter | Description                                                                                                   |
|-----------|---------------------------------------------------------------------------------------------------------------|
| data      | he data extracted from the license API calls in the format specified. The type of the output is always string |


Here you can see a workflow example using this action:

```yml
name: Report workflow
on: 
  schedule:
    # every Tuesday at 07:00 UTC
    - cron: '0 7 * * 3'

jobs:
  sendReport:
    runs-on: 'ubuntu-latest'
    steps:
    - name: Generate report
      id: report
      uses: ActionsDesk/enterprise-members-report-action@latest
      with:
        # Remember GITHUB_TOKEN doesn't work here as we require to have access to the enterprise
        token: ${{ secrets.TOKEN }} 
        enterprise: avocado-corp
        format: 'html'
    # Then use ${{ steps.report.outputs.data }} to store/send the report somewhere
    - run: echo '${{ steps.report.outputs.data }}'
```