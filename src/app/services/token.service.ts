import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, delay, Observable, of, retry, Subscription, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { AuthSession } from '../models/auth-session.model';
import { StorageService } from './storage.service';

/**
 * Refresh token response data model.
 */
interface RefreshTokenResponse {
	id_token: string;
	expires_in: string;
	refresh_token: string;
}

/**
 * Service for managing authentication tokens.
 * Handles the automatic refresh of tokens before expiry.
 */
@Injectable({ providedIn: 'root' })
export class TokenService implements OnDestroy {
	/** URL for refreshing the token. */
	private static readonly REFRESH_TOKEN_URL: string = `${environment.refreshTokenUrl}?key=${environment.apiKey}`;

	private _refreshSubscription?: Subscription; // Timer for automatic refresh.

	constructor(private readonly _http: HttpClient, private readonly _storageService: StorageService) {}

	/**
	 * Stops the automatic refresh timer when the service is destroyed.
	 */
	public ngOnDestroy(): void {
		this.stopRefreshTimer();
	}

	/**
	 * Performs a token refresh.
	 * @param refreshToken Refresh token to be used.
	 * @returns Observable with the refresh response data.
	 */
	public refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
		return this._http.post<RefreshTokenResponse>(TokenService.REFRESH_TOKEN_URL, { grant_type: 'refresh_token', refresh_token: refreshToken }).pipe(
			retry({ count: 3, delay: 1000 }),
			tap((response: RefreshTokenResponse) => this.handleRefreshToken(response.id_token, +response.expires_in, response.refresh_token)),
			catchError(this.handleError),
		);
	}

	/**
	 * Starts the automatic refresh timer.
	 * @param refreshToken Refresh token to be used.
	 * @param timeToRefresh Time in milliseconds until the token should be refreshed.
	 */
	public startRefreshTimer(refreshToken: string, timeToRefresh: number): void {
		// Stop any existing timer.
		this.stopRefreshTimer();

		// If the time for the refresh has already passed, refresh immediately and restart the timer.
		if (timeToRefresh <= 0) {
			this.scheduleTokenRefresh(refreshToken);
			return;
		}

		// Schedule the token refresh after the calculated delay.
		this._refreshSubscription = of(null)
			.pipe(delay(timeToRefresh))
			.subscribe({
				next: () => this.scheduleTokenRefresh(refreshToken),
				error: (error: Error) => console.error(`Error in refresh timer subscription: ${error.message}`),
			});
	}

	/**
	 * Stops the automatic refresh timer.
	 */
	public stopRefreshTimer(): void {
		if (this._refreshSubscription) {
			this._refreshSubscription.unsubscribe();
			this._refreshSubscription = undefined;
		}
	}

	/**
	 * Handles the token refresh response.
	 * @param newToken New token.
	 * @param newExpiresIn New token expiration time (in seconds).
	 * @param newRefreshToken New refresh token.
	 */
	private handleRefreshToken(newToken: string, newExpiresIn: number, newRefreshToken: string): void {
		const authSession: AuthSession | null = this._storageService.getAuthSession();
		if (!authSession) return;

		// Aggiorna la sessione con i nuovi token
		const updatedSession: AuthSession = authSession.withUpdatedTokens(newToken, newExpiresIn, newRefreshToken);
		this._storageService.setAuthSession(updatedSession);
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

	/**
	 * Schedules a token refresh.
	 * @param refreshToken Refresh token to be used.
	 */
	private scheduleTokenRefresh(refreshToken: string): void {
		this.refreshToken(refreshToken).subscribe({
			next: () => {
				const authSession: AuthSession | null = this._storageService.getAuthSession();
				if (authSession) this.startRefreshTimer(authSession.refreshToken, authSession.timeToRefresh); // Restart the timer.
			},
			error: (error: Error) => console.error(`Token refresh failed: ${error.message}`),
		});
	}
}
