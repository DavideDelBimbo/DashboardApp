import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Protects routes that require authentication.
 * Redirects to the login route if the user is not authenticated.
 */
export const authGuard: CanActivateFn = () => {
	const authService: AuthService = inject(AuthService);
	const router: Router = inject(Router);

	if (authService.isLoggedIn()) {
		return true;
	}

	router.navigate(['/auth/signin']);
	return false;
};
