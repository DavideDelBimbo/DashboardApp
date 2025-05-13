import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgForm } from '@angular/forms';
import { materialModules } from '../../modules/materials.module';
import { AuthService } from '../../auth/auth.service';
import { finalize } from 'rxjs';

@Component({
	selector: 'app-signin',
	imports: [RouterModule, CommonModule, ...materialModules],
	templateUrl: './signin.component.html',
	styleUrl: './signin.component.css',
})
export class SigninComponent {
	isLoading: boolean = false;
	errorMessage: string | null = null;

	constructor(private readonly _authService: AuthService, private readonly _router: Router) {}

	/**
	 * Submits the form and attempts to sign in the user.
	 * @param form The form to submit.
	 */
	public onSubmit(form: NgForm): void {
		if (!form.valid) return;

		this.isLoading = true;
		this.errorMessage = null;

		const { email, password, rememberMe } = form.value;

		this._authService
			.signIn(email, password, rememberMe)
			.pipe(finalize(() => (this.isLoading = false)))
			.subscribe({
				next: () => void this._router.navigate(['/']),
				error: (error: Error) => (this.errorMessage = error.message),
			});
	}
}
