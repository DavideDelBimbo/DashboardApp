import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { materialModules } from '../../modules/materials.module';
import { AuthService } from '../../auth/auth.service';

@Component({
	selector: 'app-homepage',
	imports: [RouterModule, ...materialModules],
	templateUrl: './homepage.component.html',
	styleUrl: './homepage.component.css',
})
export class HomepageComponent {
	constructor(private readonly _authService: AuthService, private readonly _router: Router) {}

	/**
	 * Logs the user out and redirects them to the signin page.
	 */
	public onLogout(): void {
		this._authService.logout();
		this._router.navigate(['/auth/signin']);
	}
}
