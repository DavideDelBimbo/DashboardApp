import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Protects routes that should only be accessible when the user is not authenticated (e.g. login/signup pages).
 * Redirects to home if the user is already authenticated.
 */
export const unauthGuard: CanActivateFn = () => {
	const authService: AuthService = inject(AuthService);
	const router: Router = inject(Router);

	if (!authService.isLoggedIn()) {
		return true;
	}

	router.navigate(['/']);
	return false;
};
