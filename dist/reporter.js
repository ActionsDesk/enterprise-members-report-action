"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = void 0;
const rest_1 = require("@octokit/rest");
const github_api_1 = require("./api/github-api");
const markdown_table_1 = require("markdown-table");
function generateReport(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const octokit = new rest_1.Octokit({
            auth: params.token
        });
        const orgs = yield github_api_1.getOrgsForEnterprise(params.enterprise, octokit);
        const members = yield github_api_1.getMembersFromOrgs(orgs, octokit);
        const outsideCollaborators = yield github_api_1.getOutsideCollaborators(params.enterprise, octokit);
        const pendingInvites = yield github_api_1.getPendingInvitesFromOrgs(orgs, octokit);
        // Generate the members table
        const allMembers = members.concat(outsideCollaborators);
        const membersContent = markdown_table_1.markdownTable([
            ['Login', 'Emails', 'Orgs', 'Membership'],
            ...allMembers.map(item => [item.login, item.emails.join(','), item.orgs.join(','), item.type.toString()])
        ]);
        console.log(membersContent);
        // Generate the pending invites table
        const pendingInvitesContent = markdown_table_1.markdownTable([
            ['Login', 'Email', 'Org', 'Created At'],
            ...pendingInvites.map(item => [item.login || 'Not registered', item.email, item.org, item.created_at])
        ]);
        console.log(pendingInvitesContent);
        //TODO send by email
    });
}
exports.generateReport = generateReport;
//# sourceMappingURL=reporter.js.map