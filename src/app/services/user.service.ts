import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { User } from '../models/user.model';

@Injectable({
	providedIn: 'root',
})
export class UserService {
	/** URL for users in the database. */
	private static readonly DATABASE_URL: string = `${environment.databaseUrl}/users`;

	constructor(private readonly _http: HttpClient) {}

	/**
	 * Gets all users from the database.
	 * @returns Observable of all users in the database or empty array if there are no users.
	 */
	public getUsers(): Observable<User[]> {
		return this._http.get<{ [key: string]: User } | null>(`${UserService.DATABASE_URL}.json`).pipe(
			map((response: { [key: string]: User } | null) => {
				if (!response) return [];
				return Object.entries(response).map(([userId, user]) => ({ ...user, userId }));
			}),
			catchError(this.handleError),
		);
	}

	/**
	 * Gets a user by ID.
	 * @param userId User ID to fetch.
	 * @returns Observable with the user data or null if the user does not exist.
	 */
	public getUserById(userId: string): Observable<User | null> {
		return this._http.get<User | null>(`${UserService.DATABASE_URL}/${userId}.json`).pipe(
			map((user: User | null) => {
				if (!user) return null;
				return { ...user, userId };
			}),
			catchError(this.handleError),
		);
	}

	/**
	 * Gets a user by email.
	 * @param email Email to fetch.
	 * @returns Observable with the user data or null if the user does not exist.
	 */
	public getUserByEmail(email: string): Observable<User | null> {
		return this._http.get<Record<string, User> | null>(`${UserService.DATABASE_URL}.json`).pipe(
			map((response) => {
				if (!response) return null;
				const user: [string, User] | undefined = Object.entries(response).find(([, user]) => user.email === email);
				return user ? { ...user[1], userId: user[0] } : null;
			}),
			catchError(this.handleError),
		);
	}

	/**
	 * Add a user to the database.
	 * @param user User to add.
	 * @returns Observable with the added user.
	 */
	public addUser(user: Omit<User, 'userId'>): Observable<User> {
		return this._http.post<{ name: string }>(`${UserService.DATABASE_URL}.json`, user).pipe(
			map((response: { name: string }) => {
				// Update the user in the database with the generated userId.
				const updatedUser: User = { ...user, userId: response.name } as User;
				this.updateUser(response.name, updatedUser).subscribe();
				return updatedUser;
			}),
			catchError(this.handleError),
		);
	}

	/**
	 * Update a user in the database.
	 * @param userId User ID to update.
	 * @param user User to update.
	 * @returns Observable with the updated user.
	 */
	public updateUser(userId: string, user: Partial<User>): Observable<User> {
		return this._http.patch<User>(`${UserService.DATABASE_URL}/${userId}.json`, user).pipe(
			map((response: User) => ({ ...response, userId: userId })),
			catchError(this.handleError),
		);
	}

	/**
	 * Updates the last login date of a user.
	 * * @param email Email of the user to update.
	 * @param lastLogin Last login date.
	 * @returns Observable with the updated user.
	 */
	public updateUserLastLogin(email: string, lastLogin: Date): Observable<User> {
		return this.getUserByEmail(email).pipe(
			switchMap((user: User | null) => {
				if (!user?.userId) return throwError(() => new Error('User not found'));
				return this.updateUser(user.userId, { lastLogin });
			}),
			catchError(this.handleError),
		);
	}

	/**
	 * Filters users by their first name or last name.
	 * @param query Search query to filter users.
	 * @returns Observable containing the filtered list of users.
	 */
	public filterUsers(query: string): Observable<User[]> {
		const trimmedQuery = query?.trim().toLowerCase();

		// If the query is empty, return all users.
		if (!trimmedQuery) {
			return this.getUsers();
		}

		// Filter users based on the query.
		return this.getUsers().pipe(
			map((users: User[]) => users.filter((user: User) => `${user.firstName} ${user.lastName}`.toLowerCase().includes(trimmedQuery))),
		);
	}

	/**
	 * Deletes a user from the database.
	 * @param userId User ID to delete.
	 * @returns Observable of the operation.
	 */
	public deleteUser(userId: string): Observable<void> {
		return this._http.delete<void>(`${UserService.DATABASE_URL}/${userId}.json`).pipe(catchError(this.handleError));
	}

	/**
	 * Handles HTTP errors.
	 * @param errorResponse HTTP error response.
	 * @returns Observable with the error message.
	 */
	private handleError(errorResponse: HttpErrorResponse): Observable<never> {
		const errorMessage = errorResponse.error?.error?.message || 'An unknown error occurred!';
		return throwError(() => new Error(errorMessage));
	}
}
