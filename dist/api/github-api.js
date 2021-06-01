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
exports.getOutsideCollaborator = exports.getOutsideCollaborators = exports.getMembersFromOrgs = exports.getPendingInvitesFromOrgs = exports.getOrgsForEnterprise = void 0;
const types_1 = require("../types");
function getOrgsForEnterprise(enterprise, octokit) {
    return __awaiter(this, void 0, void 0, function* () {
        let lastPage = null;
        let hasNextPage = true;
        const orgs = [];
        while (hasNextPage) {
            const response = yield octokit.graphql(`query($enterprise: String!, $page: String) {
        enterprise(slug: $enterprise) {
          organizations(first: 100, after: $page) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              login
            }
          }
        }
      }
    `, {
                enterprise,
                page: lastPage
            });
            const orgsData = response.enterprise.organizations;
            lastPage = orgsData.pageInfo.endCursor;
            hasNextPage = orgsData.pageInfo.hasNextPage;
            orgsData.nodes.forEach((org) => orgs.push(org.login));
        }
        return orgs;
    });
}
exports.getOrgsForEnterprise = getOrgsForEnterprise;
function getPendingInvitesFromOrgs(orgs, octokit) {
    return __awaiter(this, void 0, void 0, function* () {
        const pendingInvites = [];
        for (const org in orgs) {
            const response = yield octokit.paginate(octokit.rest.orgs.listPendingInvitations, {
                org
            });
            response.forEach(invite => {
                pendingInvites.push({
                    org,
                    login: invite.login,
                    email: invite.email,
                    created_at: invite.created_at,
                });
            });
        }
        // Sort them by created_at
        return pendingInvites.sort((a, b) => a.created_at.localeCompare(b.created_at));
    });
}
exports.getPendingInvitesFromOrgs = getPendingInvitesFromOrgs;
function getMembersFromOrgs(orgs, octokit) {
    return __awaiter(this, void 0, void 0, function* () {
        const members = new Map();
        for (const org in orgs) {
            let lastPage;
            let hasNextPage = true;
            while (hasNextPage) {
                const response = yield octokit.graphql(`query($org: String!, $page: String) {
                    organization(login: $org) {
                      members: membersWithRole(first: 100, after: $page) {
                        pageInfo {
                          endCursor
                          hasNextPage
                        }
                        nodes {
                          login
                          email: organizationVerifiedDomainEmails(login: $org)
                        }
                      }
                    }
                  }
                `, {
                    org,
                    page: lastPage
                });
                const membersData = response.organization.members;
                lastPage = membersData.pageInfo.endCursor;
                hasNextPage = membersData.pageInfo.hasNextPage;
                membersData.nodes.forEach((member) => {
                    const existingMember = members.get(member.login);
                    if (existingMember) {
                        // Only append the email and the org
                        member.emails.forEach(email => {
                            if (existingMember.emails.includes(email)) {
                                existingMember.emails.push(email);
                            }
                        });
                        existingMember.orgs.push(org);
                    }
                    else {
                        // Create a new item
                        members.set(member.login, Object.assign(Object.assign({}, member), { orgs: [org], type: types_1.Membership.MEMBER }));
                    }
                });
            }
        }
        return Array.from(members.values());
    });
}
exports.getMembersFromOrgs = getMembersFromOrgs;
function getOutsideCollaborators(enterprise, octokit) {
    return __awaiter(this, void 0, void 0, function* () {
        const collaborators = [];
        let lastPage = null;
        let hasNextPage = true;
        while (hasNextPage) {
            const response = yield octokit.graphql(`query($enterprise: String!, $lastPage: String) {
        enterprise(slug: $enterprise) {
          ownerInfo {
            outsideCollaborators(last: 100, after: $lastPage) {
              pageInfo {
                endCursor
                hasNextPage
              }
              nodes {
                login
                email
                organizations(first: 100) {
                  nodes {
                    login
                  }
                }
              }
            }
          }
        }
      }`, {
                enterprise,
                lastPage
            });
            hasNextPage = response.enterprise.ownerInfo.outsideCollaborators.pageInfo.hasNextPage;
            lastPage = response.enterprise.ownerInfo.outsideCollaborators.pageInfo.endCursor;
            const members = response.enterprise.ownerInfo.outsideCollaborators.nodes.map(item => {
                return {
                    orgs: item.organizations.nodes.map(org => org.login),
                    login: item.login,
                    emails: [item.email],
                    type: types_1.Membership.OUTSISE_COLLABORATOR,
                };
            });
            collaborators.push(...members);
        }
        return collaborators;
    });
}
exports.getOutsideCollaborators = getOutsideCollaborators;
function getOutsideCollaborator(orgs, octokit) {
    return __awaiter(this, void 0, void 0, function* () {
        const collaborators = new Map();
        for (const org of orgs) {
            const data = yield octokit.paginate(octokit.rest.orgs.listOutsideCollaborators, {
                org,
            });
            data.forEach(collaborator => {
                if (collaborator !== null) {
                    const existingCollaborator = collaborators.get(collaborator.login);
                    if (existingCollaborator) {
                        existingCollaborator.orgs.push(org);
                    }
                    else {
                        collaborators.set(collaborator.login, { login: collaborator.login, emails: [], orgs: [org], type: types_1.Membership.OUTSISE_COLLABORATOR });
                    }
                }
            });
        }
        return Array.from(collaborators.values());
    });
}
exports.getOutsideCollaborator = getOutsideCollaborator;
//# sourceMappingURL=github-api.js.map