import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { materialModules } from '../../modules/materials.module';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { debounceTime, Observable, distinctUntilChanged, of, startWith, switchMap } from 'rxjs';
import { Post, Priority, Status } from '../../models/post.model';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
	selector: 'app-post-dialog',
	imports: [CommonModule, ...materialModules],
	templateUrl: './post-dialog.component.html',
	styleUrl: './post-dialog.component.css',
})
export class PostDialogComponent implements OnInit {
	priorities: Priority[] = Object.values(Priority);
	statuses: Status[] = Object.values(Status);
	filteredUsers: Observable<User[]> = new Observable<User[]>();

	postForm: FormGroup;

	constructor(
		private readonly _formBuilder: FormBuilder,
		private readonly _userService: UserService,
		public dialogReference: MatDialogRef<PostDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: { isEdit: boolean; post: Post | null },
	) {
		this.postForm = this._formBuilder.group({
			postId: [data?.post?.postId],
			title: [data?.post?.title, Validators.required],
			description: [data?.post?.description, Validators.required],
			createdAt: [data?.post?.createdAt ?? new Date()],
			estimatedTime: [data?.post?.estimatedTime, [Validators.required, Validators.pattern(/^(\d{1,2}h)?\s?([0-5]?\dm)?$/)]],
			priority: [data?.post?.priority ?? Priority.Low, Validators.required],
			status: [data?.post?.status ?? Status.ToDo, Validators.required],
			assigneeId: [data?.post?.assigneeId],
			assignee: [data?.post?.assignee, [Validators.required, this.validUserValidator]],
		});
	}

	/**
	 * Set the assignees list from the service and create the filtered assignees observable.
	 */
	public ngOnInit(): void {
		this.filteredUsers = this.postForm.get('assignee')!.valueChanges.pipe(
			debounceTime(300),
			distinctUntilChanged(),
			startWith<string | User>(''),
			switchMap((value: string | User) => {
				if (typeof value !== 'string') return of([]); // If the value is an object, return an empty array.
				return this._userService.filterUsers(value); // Call the service to filter users based on the input value.
			}),
		);
	}

	/**
	 * Method to submit the form.
	 */
	public onSubmit(): void {
		if (this.postForm.valid) {
			const formValue = this.postForm.value;
			const selectedUser: User = formValue.assignee as User;
			const postToSubmit: Post = { ...formValue, assigneeId: selectedUser.userId, assignee: selectedUser };
			this.dialogReference.close(postToSubmit);
		}
	}

	/**
	 * Handles selection from the autocomplete.
	 * @param user User selected from the autocomplete.
	 */
	public selectUser(user: User): void {
		this.postForm.patchValue({ assigneeId: user.userId, assignee: user });
	}

	/**
	 * Display function for autocomplete.
	 * @param user User to display.
	 * @returns String to display.
	 */
	public displayFn(user: User | string | null): string {
		if (!user) return '';
		if (typeof user === 'string') return user;

		return user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '';
	}

	/**
	 * Custom alidator to verify that the user is a valid object and not just a manually entered string.
	 * @returns Validator function for the user form control.
	 */
	private readonly validUserValidator: ValidationErrors | null = (control: AbstractControl) => {
		const value = control.value;

		if (!value) return null;
		if (typeof value === 'string') return { invalidUser: 'Seleziona un utente dalla lista' };
		if (!value.userId) return { invalidUser: 'Utente non valido' };

		return null;
	};
}
