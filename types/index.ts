export interface GroupMember {
  userId: string;
  name: string;
  avatarUrl?: string;
  initials: string;
}

export interface Group {
  groupId: string;
  groupName: string;
  emoji?: string;
  members: GroupMember[];
}

export interface TextOverlay {
  text: string;
  x: number;
  y: number;
  size: "S" | "M" | "L";
  color: string;
}

export interface TodayPhoto {
  photoId: string;
  groupId: string;
  dateKey: string;
  imageUri: string;
  x: number;
  y: number;
  zIndex: number;
  textOverlay?: TextOverlay;
}

export type BlitzStatus = "waiting" | "live" | "locked";

export interface BlitzRound {
  roundId: string;
  groupId: string;
  status: BlitzStatus;
  endsAt?: number;
  secondsRemaining?: number;
  prompt: string;
}

export interface BlitzPhoto {
  photoId: string;
  groupId: string;
  roundId: string;
  imageUri: string;
  x: number;
  y: number;
  zIndex: number;
  textOverlay?: TextOverlay;
}

export interface AppData {
  groups: Group[];
  todayPhotos: TodayPhoto[];
  blitzRounds: BlitzRound[];
  blitzPhotos: BlitzPhoto[];
}
