import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Handles the logout process.
 * Logs the user out and redirects to the login page.
 */
export const logoutGuard: CanActivateFn = () => {
	const authService: AuthService = inject(AuthService);
	const router: Router = inject(Router);

	authService.logout();
	router.navigate(['/auth/signin']);

	// Prevents access to the actual route
	return false;
};
