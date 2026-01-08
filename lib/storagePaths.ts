export function buildTodayPath(groupId: string, uid: string, cycleId: string): string {
  return `groups/${groupId}/today/${cycleId}/${uid}/today_${Date.now()}.jpg`;
}

export function buildBlitzPath(groupId: string, uid: string, roundId: string): string {
  return `groups/${groupId}/blitz/${roundId}/${uid}/blitz_${Date.now()}.jpg`;
}
