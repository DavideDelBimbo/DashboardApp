/**
 * Interface representing the response data for an authentication session.
 */
interface AuthSessionResponse {
	_email: string;
	_userId: string;
	_token: string;
	_expiresIn: number;
	_refreshToken: string;
	_rememberMe: boolean;
}

/**
 * Authentication session model.
 * Manages authentication data and access tokens.
 */
export class AuthSession {
	/** Time before the expiry date when the token should be renewed (in milliseconds). */
	private static readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes.

	/** Timestamp when the token expires (in milliseconds). */
	private _createdAt: number = Date.now();

	constructor(
		private readonly _email: string,
		private readonly _userId: string,
		private readonly _token: string,
		private readonly _expiresIn: number,
		private readonly _refreshToken: string,
		private readonly _rememberMe: boolean,
	) {}

	/**
	 * Retrieves the email address associated with the session.
	 * @returns Email address.
	 */
	public get email(): string {
		return this._email;
	}

	/**
	 * Retrieves the user ID.
	 * @returns User ID.
	 */
	public get userId(): string {
		return this._userId;
	}

	/**
	 * Retrieves the session token.
	 * @returns Session token or null if it has expired.
	 */
	public get token(): string | null {
		if (this.isTokenExpired) {
			return null;
		}
		return this._token;
	}

	/**
	 * Retrieves the refresh token.
	 * @returns Refresh token.
	 */
	public get refreshToken(): string {
		return this._refreshToken;
	}

	/**
	 * Retrieves whether the session should be remembered.
	 * @returns Whether the session should be remembered.
	 */
	public get rememberMe(): boolean {
		return this._rememberMe;
	}

	/**
	 * Checks if the token has expired.
	 * @returns True if the token is expired, otherwise false.
	 */
	public get isTokenExpired(): boolean {
		const expirationTime = this._createdAt + this._expiresIn * 1000;
		return Date.now() > expirationTime;
	}

	/**
	 * Gets the remaining time before the token requires a refresh.
	 * @returns Remaining time in milliseconds before the token needs to be refreshed.
	 * @remarks The token should be refreshed when the remaining time is less than the defined threshold.
	 */
	public get timeToRefresh(): number {
		const expirationTime = this._createdAt + this._expiresIn * 1000;
		const timeUntilExpiration = expirationTime - Date.now();
		return Math.max(0, timeUntilExpiration - AuthSession.TOKEN_REFRESH_THRESHOLD);
	}

	/**
	 * Creates a new session instance with updated tokens.
	 * @param updatedToken The new session token.
	 * @param updateExpiresIn The new token expiration time (in seconds).
	 * @param updatedRefreshToken The new refresh token.
	 * @returns New AuthSession instance with the updated tokens.
	 */
	public withUpdatedTokens(updatedToken: string, updateExpiresIn: number, updatedRefreshToken: string): AuthSession {
		this._createdAt = Date.now(); // Reset the creation time.
		return new AuthSession(this._email, this._userId, updatedToken, updateExpiresIn, updatedRefreshToken, this._rememberMe);
	}

	/**
	 * Converts response data into an AuthSession instance.
	 * @param responseData The response data to map.
	 * @returns AuthSession instance.
	 */
	public static fromResponse(responseData: AuthSessionResponse): AuthSession {
		return new AuthSession(
			responseData._email,
			responseData._userId,
			responseData._token,
			responseData._expiresIn,
			responseData._refreshToken,
			responseData._rememberMe,
		);
	}
}
