import { UserErrEnum } from '@fastgpt/global/common/error/code/user';
import { TeamMemberWithUserSchema } from '@fastgpt/global/support/user/team/type';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { checkTeamAIPoints } from '@fastgpt/service/support/permission/teamLimit';
import { GET } from '@fastgpt/service/common/api/plusRequest';
import {
  AuthTeamTagTokenProps,
  AuthTokenFromTeamDomainResponse
} from '@fastgpt/global/support/user/team/tag';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';

export async function getUserChatInfoAndAuthTeamPoints(tmbId: string) {
  const tmb = (await MongoTeamMember.findById(tmbId, 'teamId userId').populate(
    'userId',
    'timezone openaiAccount'
  )) as TeamMemberWithUserSchema;
  if (!tmb) return Promise.reject(UserErrEnum.unAuthUser);

  await checkTeamAIPoints(tmb.teamId);

  return {
    user: tmb.userId
  };
}

export function authTeamTagToken(data: AuthTeamTagTokenProps) {
  return GET<AuthTokenFromTeamDomainResponse['data']>('/support/user/team/tag/authTeamToken', data);
}
export async function authTeamSpaceToken({
  teamId,
  teamToken
}: {
  teamId: string;
  teamToken: string;
}) {
  // get outLink and app
  const [{ uid }, member] = await Promise.all([
    authTeamTagToken({ teamId, teamToken }),
    MongoTeamMember.findOne({ teamId, role: TeamMemberRoleEnum.owner }, 'tmbId').lean()
  ]);

  return {
    uid,
    tmbId: member?._id!
  };
}
