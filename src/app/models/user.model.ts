/**
 * User model.
 */
export interface User {
	userId: string;
	firstName: string;
	lastName: string;
	email: string;
	avatar: string | null;
	createdAt: Date;
	lastLogin: Date;
}
