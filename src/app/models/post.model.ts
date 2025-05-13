import { User } from './user.model';

/**
 * Priority enum.
 */
export enum Priority {
	Low = 'Bassa',
	Medium = 'Media',
	High = 'Alta',
}

/**
 * Status enum.
 */
export enum Status {
	ToDo = 'Da Fare',
	InProgress = 'In Esecuzione',
	Done = 'Completata',
}

/**
 * Post model.
 */
export interface Post {
	postId: string;
	title: string;
	description: string;
	createdAt: Date;
	estimatedTime: string;
	priority: Priority;
	status: Status;
	assigneeId: string;
	assignee?: User | null;
}
