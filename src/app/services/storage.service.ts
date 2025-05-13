import { Injectable } from '@angular/core';
import { AuthSession } from '../models/auth-session.model';

/**
 * Service for managing persistent data in browser storage.
 * It allows data to be saved, retrieved and managed in localStorage or sessionStorage.
 */
@Injectable({
	providedIn: 'root',
})
export class StorageService {
	/** Key for authentication session data in storage. */
	private static readonly AUTH_SESSION_DATA_KEY = 'authSessionData';

	constructor() {}

	/**
	 * Get data from storage and converts it.
	 * @param key Data access key.
	 * @param storageType Type of storage to be used.
	 * @param transformFn Optional function to transform recovered data.
	 * @returns The retrieved object or null.
	 */
	public getItem<T>(key: string, storageType: Storage, transformFn?: (data: any) => T): T | null {
		const data: string | null = storageType.getItem(key);
		if (!data) return null;

		try {
			const parsedData: any = JSON.parse(data);
			return transformFn ? transformFn(parsedData) : parsedData;
		} catch (error) {
			console.error(`Error in data recovery from ${key}: ${error}`);
			return null;
		}
	}

	/**
	 * Set data in storage.
	 * @param key Data access key.
	 * @param data Data to be saved
	 * @param storageType Type of storage to be used.
	 */
	public setItem<T>(data: T, key: string, storageType: Storage): void {
		try {
			storageType.setItem(key, JSON.stringify(data));
		} catch (error) {
			console.error(`Error saving data in ${key}: ${error}`);
		}
	}

	/**
	 * deletes data from storage.
	 * @param key Data access key.
	 * @param storageType Type of storage to be used.
	 */
	public deleteItem(key: string, storageType: Storage): void {
		storageType.removeItem(key);
	}

	/**
	 * Deletes all storage data.
	 * @param storageType Type of storage to be used.
	 */
	public clearAll(storageType: Storage): void {
		storageType.clear();
	}

	/**
	 * Verify whether a valid session exists.
	 * @param key Data access key.
	 * @param storageType Type of storage to be used.
	 * @returns true if a valid session exists.
	 */
	public hasValidSession(key: string, storageType: Storage): boolean {
		return !!this.getItem(key, storageType);
	}

	/**
	 * Get an authentication session from storage.
	 * @param key Data access key (default: 'authSessionData').
	 * @returns Authentication session data or null.
	 */
	public getAuthSession(key: string = StorageService.AUTH_SESSION_DATA_KEY): AuthSession | null {
		return (
			this.getItem<AuthSession>(key, localStorage, AuthSession.fromResponse) ?? this.getItem<AuthSession>(key, sessionStorage, AuthSession.fromResponse)
		);
	}

	/**
	 * Set an authentication session data in storage.
	 * @param authSession Authentication session data.
	 * @param key Data access key (default: 'authSessionData').
	 */
	public setAuthSession(authSession: AuthSession, key: string = StorageService.AUTH_SESSION_DATA_KEY): void {
		const storageType: Storage = authSession.rememberMe ? localStorage : sessionStorage;
		this.setItem<AuthSession>(authSession, key, storageType);
	}

	/**
	 * Deletes the authentication session from storage.
	 * @param key Data access key (default: 'authSessionData').
	 */
	public deleteAuthSession(key: string = StorageService.AUTH_SESSION_DATA_KEY): void {
		this.deleteItem(key, sessionStorage);
		this.deleteItem(key, localStorage);
	}
}
