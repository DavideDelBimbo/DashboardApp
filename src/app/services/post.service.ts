import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { UserService } from './user.service';
import { Post } from '../models/post.model';
import { User } from '../models/user.model';

/**
 * Service to manage posts.
 * This service is used to interact with the database to get, add, update and delete posts.
 */
@Injectable({
	providedIn: 'root',
})
export class PostService {
	/** URL for posts in the database. */
	private static readonly DATABASE_URL: string = `${environment.databaseUrl}/posts`;

	constructor(private readonly _http: HttpClient, private readonly _userService: UserService) {}

	/**
	 * Get all posts from the database.
	 * @returns Observable of all posts in the database or empty array if there are no posts.
	 */
	public getPosts(): Observable<Post[]> {
		return this._http.get<{ [key: string]: Post } | null>(`${PostService.DATABASE_URL}.json`).pipe(
			map((response: { [key: string]: Post } | null) => {
				if (!response) return [];
				return Object.entries(response).map(([postId, post]) => ({ ...post, postId }));
			}),
			switchMap((posts: Post[]) => {
				if (posts.length === 0) return [];

				// Group posts by assigneeId to avoid duplicate requests.
				const assigneeIds: string[] = [...new Set(posts.map((post) => post.assigneeId))];
				return forkJoin(assigneeIds.map((assigneeId) => this._userService.getUserById(assigneeId))).pipe(
					map((users: (User | null)[]) => {
						// Create a map of users by userId.
						const userMap: Map<string, User> = new Map<string, User>();
						users.forEach((user: User | null) => user && userMap.set(user.userId, user));

						// Enrich posts with complete user data.
						return posts.map((post: Post) => ({ ...post, assignee: userMap.get(post.assigneeId) }));
					}),
				);
			}),
			catchError(this.handleError),
		);
	}

	/**
	 * Get a post by ID.
	 * * @param postId Post ID to fetch.
	 * * @returns Observable with the post data or null if the post does not exist.
	 */
	public getPostById(postId: string): Observable<Post | null> {
		return this._http.get<Post>(`${PostService.DATABASE_URL}/${postId}.json`).pipe(
			switchMap((post: Post | null) => {
				if (!post) return of(null);

				// Retrieve complete user data.
				return this._userService.getUserById(post.assigneeId).pipe(map((user: User | null) => ({ ...post, postId, assignee: user })));
			}),
			catchError(this.handleError),
		);
	}

	/**
	 * Add a post to the database.
	 * @param post Post to add.
	 * @returns Observable of the added post.
	 */
	public addPost(post: Omit<Post, 'postId'>): Observable<Post> {
		// Remove the assignee field before saving.
		const { assignee, ...postToSave } = post;

		return this._http.post<{ name: string }>(`${PostService.DATABASE_URL}.json`, postToSave).pipe(
			map((response: { name: string }) => {
				// Update the post in the database with the generated postId.
				const updatedPost: Post = { ...postToSave, postId: response.name };
				this.updatePost(response.name, updatedPost).subscribe();
				return { ...updatedPost, assignee: assignee };
			}),
			catchError(this.handleError),
		);
	}

	/**
	 * Update a post in the database.
	 * @param postId Post ID to update.
	 * @param post Post to update.
	 * @returns Observable of the updated post.
	 */
	public updatePost(postId: string, post: Partial<Post>): Observable<Post> {
		// Remove the assignee field before saving.
		const { assignee, ...postToUpdate } = post;

		return this._http.patch<Post>(`${PostService.DATABASE_URL}/${postId}.json`, postToUpdate).pipe(
			map((response: Post) => ({ ...response, postId: postId, assignee: assignee })),
			catchError(this.handleError),
		);
	}

	/**
	 * Delete a post from the database.
	 * @param postId Post ID to delete.
	 * @returns Observable of the operation.
	 */
	public deletePost(postId: string): Observable<void> {
		return this._http.delete<void>(`${PostService.DATABASE_URL}/${postId}.json`).pipe(catchError(this.handleError));
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
