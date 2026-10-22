export type ApplicationRole = 'STUDENT' | 'TEACHER' | 'ADVISOR' | 'DIRECTOR' | 'ADMINISTRATOR';

export interface AuthenticatedUser {
  readonly id: string;
  readonly username: string;
  readonly roles: readonly ApplicationRole[];
  readonly displayName: string | null;
}
