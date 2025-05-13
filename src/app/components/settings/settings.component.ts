import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, AbstractControl, ValidationErrors, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize, of, switchMap, catchError, lastValueFrom, Observable } from 'rxjs';
import { materialModules } from '../../modules/materials.module';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

/**
 * Interface for user profile data.
 */
interface UserProfileData {
	firstName: string;
	lastName: string;
	avatar: string | null;
}

/**
 * Settings component for managing user profile and settings.
 * Provides functionality to update user profile information, change password, and manage avatar.
 */
@Component({
	selector: 'app-settings',
	imports: [CommonModule, ReactiveFormsModule, RouterModule, ...materialModules],
	templateUrl: './settings.component.html',
	styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
	profileForm: FormGroup;
	isLoading: boolean = false;
	isSaving: boolean = false;
	successMessage: string | null = null;
	errorMessage: string | null = null;
	selectedFile: File | null = null;
	originalProfileData: UserProfileData | null = null;

	constructor(private readonly _formBuilder: FormBuilder, private readonly _authService: AuthService, private readonly _userService: UserService) {
		// Create the profile form con validatori condizionali
		this.profileForm = this._formBuilder.group({
			firstName: ['', Validators.required],
			lastName: ['', Validators.required],
			email: [{ value: '', disabled: true }],
			avatar: [null],
			passwordGroup: this._formBuilder.group(
				{ newPassword: ['', Validators.minLength(6)], confirmPassword: ['', this.conditionalConfirmValidator] },
				{ validators: this.passwordGroupValidator, updateOn: 'change' },
			),
		});
	}

	/**
	 * Initialises the component and loads the data of the current user.
	 */
	public ngOnInit(): void {
		this.isLoading = true;
		this.successMessage = null;
		this.errorMessage = null;

		this._authService.currentUser?.pipe(finalize(() => (this.isLoading = false))).subscribe({
			next: (user: User | null) => {
				if (!user) return;

				this.profileForm.patchValue({
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					avatar: user.avatar,
				});

				// Save original data for comparison.
				this.originalProfileData = {
					firstName: user.firstName,
					lastName: user.lastName,
					avatar: user.avatar,
				};
			},
			error: (error: Error) => (this.errorMessage = error.message),
		});
	}

	/**
	 * Accessor for the password group form control.
	 * @returns The password group form control.
	 */
	public get passwordGroup(): FormGroup {
		return this.profileForm.get('passwordGroup') as FormGroup;
	}

	/**
	 * Get the profile data from the form.
	 * @returns The user profile data.
	 */
	private get profileData(): UserProfileData {
		return {
			firstName: this.profileForm.get('firstName')?.value as string,
			lastName: this.profileForm.get('lastName')?.value as string,
			avatar: this.profileForm.get('avatar')?.value as string | null,
		};
	}

	/**
	 * Checks whether changes have been made to the profile.
	 * @returns True if there are changes, false otherwise.
	 */
	public hasProfileChanges(): boolean {
		if (!this.originalProfileData) return false;

		return (
			this.profileData.firstName !== this.originalProfileData.firstName ||
			this.profileData.lastName !== this.originalProfileData.lastName ||
			this.profileData.avatar !== this.originalProfileData.avatar
		);
	}

	/**
	 * Check whether password change information has been entered.
	 * @returns True if there are changes, false otherwise.
	 */
	public hasPasswordChanges(): boolean {
		return !!this.passwordGroup.value.newPassword || !!this.passwordGroup.value.confirmPassword;
	}

	/**
	 * Checks whether the form is valid for submission.
	 * @returns True if the form can be submitted, false otherwise.
	 */
	public canSubmit(): boolean {
		const isProfileValid: boolean = (this.profileForm.get('firstName')?.valid ?? false) && (this.profileForm.get('lastName')?.valid ?? false);
		return (this.hasProfileChanges() && isProfileValid) || (this.hasPasswordChanges() && this.passwordGroup.valid);
	}

	/**
	 * Gestisce l'invio del form
	 */
	public onSubmit(): void {
		if (!this.canSubmit()) return;

		this.errorMessage = null;
		this.successMessage = null;
		this.isSaving = true;

		// Manage changes in parallel.
		const updateTasks: any[] = [];
		let successMessages: string[] = [];

		// Update profile if modified.
		const isProfileValid: boolean = (this.profileForm.get('firstName')?.valid ?? false) && (this.profileForm.get('lastName')?.valid ?? false);
		if (this.hasProfileChanges() && isProfileValid) {
			updateTasks.push(
				this._authService.currentUser.pipe(
					switchMap((user: User | null) => {
						if (!user) return of(null);
						return this._userService
							.updateUser(user.userId, this.profileData)
							.pipe(finalize(() => (!this.errorMessage ? successMessages.push('Profilo aggiornato con successo.') : null)));
					}),
					catchError((error: Error) => {
						this.errorMessage = error.message;
						return of(null);
					}),
				),
			);
		}

		// Manage password change.
		if (this.hasPasswordChanges() && this.passwordGroup.valid) {
			updateTasks.push(
				this._authService.changePassword(this.passwordGroup.value.newPassword).pipe(
					finalize(() => (!this.errorMessage ? successMessages.push('Password cambiata con successo.') : null)),
					catchError((error: Error) => {
						this.errorMessage = error.message;
						return of(null);
					}),
				),
			);
		}

		// Perform all update operations
		if (updateTasks.length > 0) {
			Promise.all(updateTasks.map((task) => lastValueFrom(task as Observable<string | User | null>)))
				.then(() => {
					this.successMessage = successMessages.join('\n');

					// Update original data.
					if (this.hasProfileChanges()) this.originalProfileData = this.profileData;

					// Reset password fields.
					if (this.hasPasswordChanges()) this.passwordGroup.reset();

					// Reset selected file.
					this.selectedFile = null;
				})
				.catch((error: Error) => (this.errorMessage = error.message || 'An error occurred while saving changes.'))
				.finally(() => (this.isSaving = false));
		} else {
			this.isSaving = false;
		}
	}

	/**
	 * Handles the selection of a file for the avatar.
	 * @param event The file input change event.
	 */
	public onFileSelected(event: Event): void {
		const inputElement: HTMLInputElement = event.target as HTMLInputElement;
		if (inputElement.files && inputElement.files.length > 0) {
			this.selectedFile = inputElement.files[0];

			// Mostra l'anteprima dell'immagine
			const reader: FileReader = new FileReader();
			reader.onload = (e) => this.profileForm.get('avatar')?.setValue(e.target?.result as string);

			reader.readAsDataURL(this.selectedFile);
		}
	}

	/**
	 * Removes the current avatar.
	 */
	public removeAvatar(fileInput: HTMLInputElement): void {
		this.profileForm.get('avatar')?.setValue(null);
		this.selectedFile = null;
		fileInput.value = '';
	}

	/**
	 * Conditional validator for the password confirmation field.
	 * @param control The form control to validate.
	 * @returns Validation errors if any, null otherwise.
	 */
	private readonly conditionalConfirmValidator = (control: AbstractControl): ValidationErrors | null => {
		if (!control.parent) return null;

		const newPassword: string = control.parent.get('newPassword')?.value;
		const confirmPassword: string = control.value;

		// If the new password has been entered, confirmation is mandatory.
		if (newPassword && !confirmPassword) return { required: true };

		// If both fields are filled in, they must match.
		if (newPassword && confirmPassword && newPassword !== confirmPassword) return { passwordMismatch: true };

		return null;
	};

	/**
	 * Validator for the complete password group
	 * @param group The form group to validate.
	 * @returns Validation errors if any, null otherwise.
	 */
	private readonly passwordGroupValidator = (group: AbstractControl): ValidationErrors | null => {
		const newPassword: string = group.get('newPassword')?.value;
		const confirmPassword: string = group.get('confirmPassword')?.value;

		// Validate individual fields.
		if (!newPassword) return { newPasswordRequired: true };
		if (!confirmPassword) return { confirmPasswordRequired: true };

		// Validate password match.
		if (newPassword !== confirmPassword) return { passwordMismatch: true };

		return null;
	};
}
