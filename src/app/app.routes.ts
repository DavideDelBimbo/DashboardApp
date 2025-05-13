import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { logoutGuard } from './auth/logout.guard';
import { unauthGuard } from './auth/unauth.guard';
import { HomepageComponent } from './components/homepage/homepage.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SigninComponent } from './components/signin/signin.component';
import { SignupComponent } from './components/signup/signup.component';
import { SettingsComponent } from './components/settings/settings.component';
import { MainComponent } from './components/main/main.component';

/**
 * Helper function to create multiple redirect routes to the same destination.
 * @param paths Array of source paths.
 * @param redirectTo Destination route.
 * @returns Array of route objects.
 */
function createRedirects(paths: string[], redirectTo: string): Routes {
	return paths.map((path) => ({ path, redirectTo, pathMatch: 'full' }));
}

export const routes: Routes = [
	// Main section with homepage and dashboard.
	{
		path: '',
		component: HomepageComponent,
		canActivate: [authGuard],
		children: [
			{ path: '', component: MainComponent },
			{ path: 'dashboard', component: DashboardComponent },
			{ path: 'settings', component: SettingsComponent },
		],
	},
	...createRedirects(['home', 'homepage', 'dashboard'], '/'),

	// Logout route.
	{ path: 'logout', component: HomepageComponent, canActivate: [logoutGuard] },

	// Authentication section.
	{
		path: 'auth',
		children: [
			// Sign-in routes.
			{ path: 'signin', component: SigninComponent, canActivate: [unauthGuard] },
			...createRedirects(['', 'login'], '/auth/signin'),

			// Sign-up routes.
			{ path: 'signup', component: SignupComponent, canActivate: [unauthGuard] },
			...createRedirects(['register'], '/auth/signup'),
		],
	},

	// Global redirects for authentication.
	...createRedirects(['signin', 'login'], '/auth/signin'),
	...createRedirects(['signup', 'register'], '/auth/signup'),
];
