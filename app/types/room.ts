import { User, Location } from './user';

export type CommonPoint = Location;

export type RoomMode = 'TO' | 'FROM';
export type MembershipStatus = 'ACTIVE' | 'DISCONNECTED' | 'LEFT';
export type RouteStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Room {
  id: string;
  roomCode: string;
  mode: RoomMode;
  name: string;
  commonPoint: Location;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  creatorId?: string;
}

export interface RoomMembership {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  joinedAt: string;
  lastSeen: string;
  status: MembershipStatus;
  from?: Location;
  to?: Location;
  polyline?: string;
  deviceType?: string;
  routeStatus: RouteStatus;
}