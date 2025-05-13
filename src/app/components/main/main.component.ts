import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { materialModules } from '../../modules/materials.module';
import { FormControl } from '@angular/forms';
import { finalize } from 'rxjs';
import { PostService } from '../../services/post.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Post, Priority, Status } from '../../models/post.model';
import { PostDialogComponent } from '../post-dialog/post-dialog.component';
import { User } from '../../models/user.model';

@Component({
	selector: 'app-main',
	imports: [CommonModule, ...materialModules],
	templateUrl: './main.component.html',
	styleUrl: './main.component.css',
})
export class MainComponent implements OnInit {
	posts: Post[] = [];
	filteredPosts: Post[] = [];
	isLoading: boolean = false;

	searchControl: FormControl<string | null> = new FormControl<string | null>('');
	priorityFilter: FormControl<Priority | null> = new FormControl<Priority | null>(null);
	statusFilter: FormControl<Status | null> = new FormControl<Status | null>(null);
	assigneeFilter: FormControl<User | null> = new FormControl<User | null>(null);

	priorities: Priority[] = Object.values(Priority);
	statuses: Status[] = Object.values(Status);
	assignees: User[] = [];

	constructor(private readonly _postService: PostService, private readonly _dialog: MatDialog, private readonly _snackBar: MatSnackBar) {}

	/**
	 * Retrieves the posts from the service and sets the loading state.
	 */
	public ngOnInit(): void {
		this.isLoading = true;
		this._postService
			.getPosts()
			.pipe(finalize(() => (this.isLoading = false)))
			.subscribe({
				next: (posts: Post[]) => {
					this.posts = posts;
					this.filteredPosts = posts;
					this.extractAssignees();
					this.setupFilterListeners();
				},
				error: (error: Error) => this._snackBar.open(`Errore durante il caricamento delle attività: ${error.message}`, 'Chiudi', { duration: 3000 }),
			});
	}

	/**
	 * Extracts unique assignees from posts.
	 */
	private extractAssignees(): void {
		this.assignees = this.posts
			.filter((post: Post) => post.assignee)
			.reduce((uniqueAssignees: User[], post: Post) => {
				if (!uniqueAssignees.some((assignee: User) => assignee.userId === post.assignee!.userId)) uniqueAssignees.push(post.assignee!);
				return uniqueAssignees;
			}, [] as User[]);
	}

	/**
	 * Configures listener for filter changes.
	 */
	private setupFilterListeners(): void {
		this.searchControl.valueChanges.subscribe(() => this.applyFilters());
		this.priorityFilter.valueChanges.subscribe(() => this.applyFilters());
		this.statusFilter.valueChanges.subscribe(() => this.applyFilters());
		this.assigneeFilter.valueChanges.subscribe(() => this.applyFilters());
	}

	/**
	 * Apply filters to posts.
	 */
	public applyFilters(): void {
		let filtered: Post[] = [...this.posts];

		// Filter for search text in title.
		const searchText: string | undefined = this.searchControl.value?.toLowerCase();
		if (searchText) filtered = filtered.filter((post) => post.title.toLowerCase().includes(searchText));

		// Priority filter.
		const priority: Priority | null = this.priorityFilter.value;
		if (priority) filtered = filtered.filter((post) => post.priority === priority);

		// Status filter.
		const status: Status | null = this.statusFilter.value;
		if (status) filtered = filtered.filter((post) => post.status === status);

		// Assignee filter
		const assignee: User | null = this.assigneeFilter.value;
		if (assignee) filtered = filtered.filter((post) => post.assignee?.userId === assignee.userId);

		this.filteredPosts = filtered;
	}

	/**
	 * Reset all filters.
	 */
	public resetFilters(): void {
		this.searchControl.setValue('');
		this.priorityFilter.setValue(null);
		this.statusFilter.setValue(null);
		this.assigneeFilter.setValue(null);
		this.filteredPosts = [...this.posts];
	}

	/**
	 * Opens the dialog to add a new post.
	 */
	public openAddPostDialog(): void {
		const dialogReference = this._dialog.open(PostDialogComponent, { width: '400px', data: { isEdit: false, post: null } });

		dialogReference.afterClosed().subscribe((result: Post | null) => {
			if (!result) return;

			this.isLoading = true;
			this._postService
				.addPost(result)
				.pipe(finalize(() => (this.isLoading = false)))
				.subscribe({
					next: (newPost: Post) => {
						this.posts = [...this.posts, newPost];
						this._snackBar.open('Attività aggiunta con successo', 'Chiudi', { duration: 3000 });
					},
					error: (error: Error) => this._snackBar.open(`Errore durante l'aggiunta dell'attività: ${error.message}`, 'Chiudi', { duration: 3000 }),
				});
		});
	}

	/**
	 * Opens the dialog to edit a post.
	 * @param post Post to edit.
	 */
	public editPost(post: Post): void {
		const dialogReference = this._dialog.open(PostDialogComponent, { width: '400px', data: { isEdit: true, post: post } });

		dialogReference.afterClosed().subscribe((result: Post | null) => {
			if (!result) return;

			this.isLoading = true;
			this._postService
				.updatePost(result.postId, result)
				.pipe(finalize(() => (this.isLoading = false)))
				.subscribe({
					next: (updatedPost: Post) => {
						this.posts = this.posts.map((p) => (p.postId === updatedPost.postId ? updatedPost : p));
						this._snackBar.open('Attività aggiornata con successo', 'Chiudi', { duration: 3000 });
					},
					error: (error: Error) => this._snackBar.open(`Errore durante l'aggiornamento dell'attività: ${error.message}`, 'Chiudi', { duration: 3000 }),
				});
		});
	}

	/**
	 * Deletes a post.
	 * @param post Post to delete.
	 */
	public deletePost(post: Post): void {
		const confirmation = confirm(`Sei sicuro di voler eliminare l'attività "${post.title}"?`);
		if (!confirmation) return;

		this.isLoading = true;
		this._postService
			.deletePost(post.postId)
			.pipe(finalize(() => (this.isLoading = false)))
			.subscribe({
				next: () => {
					this.posts = this.posts.filter((p) => p.postId !== post.postId);
					this._snackBar.open('Attività eliminata con successo', 'Chiudi', { duration: 3000 });
				},
				error: (error: Error) => this._snackBar.open(`Errore durante l'eliminazione dell'attività: ${error.message}`, 'Chiudi', { duration: 3000 }),
			});
	}

	/**
	 * Gets the color for the priority.
	 * @param priority Priority of the post.
	 * @returns The color for the priority.
	 */
	public getPriorityColor(priority: Priority | undefined): string {
		switch (priority) {
			case Priority.High:
				return 'rgb(244, 67, 54)';
			case Priority.Medium:
				return 'rgb(255, 152, 0)';
			case Priority.Low:
				return 'rgb(76, 175, 80)';
			default:
				return 'rgb(158, 158, 158)';
		}
	}

	/**
	 * Gets the color for the status.
	 * @param status Status of the post.
	 * @returns The color for the status.
	 */
	public getStatusColor(status: Status | undefined): string {
		switch (status) {
			case Status.ToDo:
				return 'rgb(158, 158, 158)';
			case Status.InProgress:
				return 'rgb(33, 150, 243)';
			case Status.Done:
				return 'rgb(76, 175, 80)';
			default:
				return 'rgb(158, 158, 158)';
		}
	}
}
