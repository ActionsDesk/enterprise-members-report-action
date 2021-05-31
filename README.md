# Email license report action

## Description

This action generates reports and sends them over email:
- **Members**: a report of all users that are members of at least one org in the enterprise
- **Outside collaborators**: a compilation of all outside collaborators in all the orgs
- **Pending invites**: the list of all pending invites in all the orgs

## How to

This actions has the following inputs:

| Parameter  | Description                                                                | Default       | Is Required |
|------------|----------------------------------------------------------------------------|---------------|-------------|
| token      | A personal access token with permissions on all the orgs of the enterprise | None          | ✅           |
| enterprise | The enterprise where we want to generate the report                        | None          | ✅           |
| emails     | The emails, comma separated, where the report will be sent                 | None          | ✅           |
| smtp_host  | The host of the smtp server                                                | None          | ✅           |
| smtp_port  | The port of the smtp server                                                | None          | ✅           |
| sender     | The name of the sender                                                     | GitHub        | ❌           |
| subject    | The name of the email subject                                              | GitHub Report | ❌           |

Here you can see a workflow example using this action:

```yml
TBD
```