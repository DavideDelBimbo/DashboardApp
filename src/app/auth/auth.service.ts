import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, switchMap, map, tap, throwError, of } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { AuthSession } from '../models/auth-session.model';
import { UserService } from '../services/user.service';
import { TokenService } from '../services/token.service';
import { StorageService } from '../services/storage.service';
import { User } from '../models/user.model';

/**
 * Authentication response data model.
 */
interface AuthResponse {
	email: string;
	localId: string;
	idToken: string;
	expiresIn: string;
	refreshToken: string;
}

/**
 * Authentication service for handling user authentication and session management.
 * Provides methods for signing up, signing in, logging out, managing user sessions and tokens.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
	/** URL for signing up a new user. */
	private static readonly SIGNUP_URL: string = `${environment.signupUrl}?key=${environment.apiKey}`;
	/** URL for signing in an existing user. */
	private static readonly SIGNIN_URL: string = `${environment.signinUrl}?key=${environment.apiKey}`;
	/** URL for changing user password. */
	private static readonly CHANGE_PASSWORD_URL: string = `${environment.changePasswordUrl}?key=${environment.apiKey}`;

	private readonly _authSessionSubject: BehaviorSubject<AuthSession | null> = new BehaviorSubject<AuthSession | null>(null); // Current authentication session.

	constructor(
		private readonly _http: HttpClient,
		private readonly _userService: UserService,
		private readonly _tokenService: TokenService,
		private readonly _storageService: StorageService,
	) {
		// Try to retrieve an existing session at startup.
		const authSession: AuthSession | null = this._storageService.getAuthSession();
		if (!authSession) return;

		// Sets the current session and starts the refresh timer.
		this._authSessionSubject.next(authSession);
		this._tokenService.startRefreshTimer(authSession.refreshToken, authSession.timeToRefresh);
	}

	/**
	 * Gets the current authenticated session.
	 * @returns The current authentication session or null if no user is authenticated.
	 */
	public get currentAuthSession(): AuthSession | null {
		return this._authSessionSubject.value;
	}

	/**
	 * Gets the current authenticated user.
	 * @returns An Observable of the current authenticated user or null if no user is authenticated.
	 */
	public get currentUser(): Observable<User | null> {
		if (!this.currentAuthSession?.email) return of(null);

		return this._userService.getUserByEmail(this.currentAuthSession.email).pipe(
			map((user) => user ?? null),
			catchError(this.handleError),
		);
	}

	/**
	 * Checks if a user is currently logged in and their token is not expired.
	 * @returns true if the user is logged in and the token is valid, otherwise false.
	 */
	public isLoggedIn(): boolean {
		return !!this.currentAuthSession && !this.currentAuthSession.isTokenExpired;
	}

	/**
	 * Signs up a new user with the provided email and password.
	 * @param firstName First name of the user.
	 * @param lastName Last name of the user.
	 * @param email Email address of the user.
	 * @param password  Password of the user.
	 * @param rememberMe Whether to remember the user session.
	 * @returns Observable of the authentication response data.
	 */
	public signUp(firstName: string, lastName: string, email: string, password: string, rememberMe: boolean): Observable<AuthResponse> {
		return this._http.post<AuthResponse>(AuthService.SIGNUP_URL, { email, password, returnSecureToken: true }).pipe(
			tap((response: AuthResponse) => {
				this.handleAuthentication(response.email, response.localId, response.idToken, +response.expiresIn, response.refreshToken, rememberMe);
			}),
			switchMap((response: AuthResponse) =>
				this._userService
					.addUser({ firstName: firstName, lastName: lastName, email: email, avatar: null, createdAt: new Date(), lastLogin: new Date() })
					.pipe(map(() => response)),
			),
			catchError(this.handleError),
		);
	}

	/**
	 * Signs in an existing user with the provided email and password.
	 * @param email Email address of the user.
	 * @param password  Password of the user.
	 * @param rememberMe Whether to remember the user session.
	 * @returns Observable of the authentication response data.
	 */
	public signIn(email: string, password: string, rememberMe: boolean): Observable<AuthResponse> {
		return this._http.post<AuthResponse>(AuthService.SIGNIN_URL, { email, password, returnSecureToken: true }).pipe(
			tap((response: AuthResponse) => {
				this.handleAuthentication(response.email, response.localId, response.idToken, +response.expiresIn, response.refreshToken, rememberMe);
			}),
			switchMap((response: AuthResponse) => this._userService.updateUserLastLogin(email, new Date()).pipe(map(() => response))),
			catchError(this.handleError),
		);
	}

	/**
	 * Changes the password of the authenticated user.
	 * @param newPassword New password for the user.
	 * @returns Observable of the authentication response data.
	 */
	public changePassword(newPassword: string): Observable<AuthResponse> {
		const authToken = this.currentAuthSession?.token;
		const rememberMe = this.currentAuthSession?.rememberMe ?? false;

		return this._http.post<AuthResponse>(AuthService.CHANGE_PASSWORD_URL, { idToken: authToken, password: newPassword, returnSecureToken: true }).pipe(
			tap((response: AuthResponse) => {
				this.handleAuthentication(response.email, response.localId, response.idToken, +response.expiresIn, response.refreshToken, rememberMe);
			}),
			catchError(this.handleError),
		);
	}

	/**
	 * Logs out the current user, clears the user session and stops the token refresh timer.
	 */
	public logout(): void {
		this._authSessionSubject.next(null);
		this._storageService.deleteAuthSession();
		this._tokenService.stopRefreshTimer();
	}

	/**
	 * Handles user authentication.
	 * @param email Email address of the user.
	 * @param userId Unique identifier of the user.
	 * @param token Authentication token for the user.
	 * @param expiresIn Token expiration time (in seconds).
	 * @param refreshToken Refresh token for the user.
	 * @param rememberMe Whether to remember the user session.
	 */
	private handleAuthentication(email: string, userId: string, token: string, expiresIn: number, refreshToken: string, rememberMe: boolean): void {
		const authSession: AuthSession = new AuthSession(email, userId, token, expiresIn, refreshToken, rememberMe);

		this._authSessionSubject.next(authSession);
		this._storageService.setAuthSession(authSession);
		this._tokenService.startRefreshTimer(authSession.refreshToken, authSession.timeToRefresh);
	}

	/**
	 * Handles HTTP errors.
	 * @param errorResponse HTTP error response.
	 * @returns Observable with the error message.
	 */
	private handleError(errorResponse: HttpErrorResponse): Observable<never> {
		const errorMessage: string = errorResponse.error?.error?.message || 'An unknown error occurred!';
		return throwError(() => new Error(errorMessage));
	}
}
