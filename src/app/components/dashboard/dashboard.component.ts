import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Color, NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { materialModules } from '../../modules/materials.module';
import { PostService } from '../../services/post.service';
import { Post, Priority, Status } from '../../models/post.model';

@Component({
	selector: 'app-dashboard',
	standalone: true,
	imports: [CommonModule, NgxChartsModule, ...materialModules],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
	priorityChartData: { name: string; value: number }[] = [];
	statusChartData: { name: string; value: number }[] = [];
	assigneeChartData: { name: string; value: number }[] = [];
	timelineData: { name: string; series: { name: string; value: number }[] }[] = [];

	// KPI.
	totalTasks: number = 0;
	completedTasks: number = 0;
	inProgressTasks: number = 0;
	pendingTasks: number = 0;
	completionRate: number = 0;

	// Chart color schemes.
	priorityColorScheme: string | Color = {
		name: 'priorityScheme',
		selectable: true,
		group: ScaleType.Ordinal,
		domain: ['rgb(244, 67, 54)', 'rgb(255, 152, 0)', 'rgb(76, 175, 80)', 'rgb(158, 158, 158)'],
	};
	statusColorScheme: string | Color = {
		name: 'statusScheme',
		selectable: true,
		group: ScaleType.Ordinal,
		domain: ['rgb(158, 158, 158)', 'rgb(33, 150, 243)', 'rgb(76, 175, 80)', 'rgb(158, 158, 158)'],
	};

	constructor(private readonly _postService: PostService) {}

	/**
	 * Loads the posts from the database and processes them to create the data for the charts.
	 */
	public ngOnInit(): void {
		this._postService.getPosts().subscribe((posts) => {
			this.processPriorityData(posts);
			this.processStatusData(posts);
			this.processAssigneeData(posts);
			this.processTimelineData(posts);
			this.processKPIs(posts);
		});
	}

	/**
	 * Processes the posts to create data for the priority chart.
	 * @param posts Array of posts to process.
	 */
	private processPriorityData(posts: Post[]): void {
		// Group tasks by priority.
		const priorityMap = posts.reduce((map, post) => map.set(post.priority, (map.get(post.priority) ?? 0) + 1), new Map<Priority, number>());

		// Convert to chart data format.
		this.priorityChartData = Array.from(priorityMap, ([name, value]) => ({ name, value }));
	}

	/**
	 * Processes the posts to create data for the status chart.
	 * @param posts Array of posts to process.
	 */
	private processStatusData(posts: Post[]): void {
		// Group tasks by status.
		const statusMap = posts.reduce((map, post) => map.set(post.status, (map.get(post.status) ?? 0) + 1), new Map<Status, number>());

		// Convert to chart data format.
		this.statusChartData = Array.from(statusMap, ([name, value]) => ({ name, value }));
	}

	/**
	 * Processes the posts to create data for the assignee chart.
	 * @param posts Array of posts to process.
	 */
	private processAssigneeData(posts: Post[]): void {
		// Group tasks by assignee.
		const assigneeMap = posts.reduce((map, post) => {
			const assigneeName: string = `${post.assignee?.firstName} ${post.assignee?.lastName}`;
			return map.set(assigneeName, (map.get(assigneeName) ?? 0) + 1);
		}, new Map<string, number>());

		// Convert to chart data format.
		this.assigneeChartData = Array.from(assigneeMap, ([name, value]) => ({ name, value }));
	}

	/**
	 * Processes the posts to create data for the timeline chart.
	 * @param posts Array of posts to process.
	 */
	private processTimelineData(posts: Post[]): void {
		// Group tasks by month and year.
		const timelineMap = posts.reduce((map, post) => {
			const date: Date = new Date(post.createdAt);
			const monthYear: string = `${date.getMonth() + 1}/${date.getFullYear()}`;
			return map.set(monthYear, (map.get(monthYear) ?? 0) + 1);
		}, new Map<string, number>());

		// Convert the map to a sorted chart data format.
		const series: { name: string; value: number }[] = Array.from(timelineMap.entries())
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => {
				const [monthA, yearA] = a.name.split('/').map(Number);
				const [monthB, yearB] = b.name.split('/').map(Number);
				return new Date(yearA, monthA - 1).getTime() - new Date(yearB, monthB - 1).getTime();
			});

		// Add the series to the timeline data.
		this.timelineData = [{ name: 'Activities', series }];
	}

	/**
	 * Processes the KPIs based on the posts.
	 * @param posts Array of posts to process.
	 */
	private processKPIs(posts: Post[]): void {
		this.totalTasks = posts.length;
		this.completedTasks = posts.filter((post) => post.status === Status.Done).length;
		this.inProgressTasks = posts.filter((post) => post.status === Status.InProgress).length;
		this.pendingTasks = posts.filter((post) => post.status === Status.ToDo).length;
		this.completionRate = this.totalTasks > 0 ? Math.round((this.completedTasks / this.totalTasks) * 100) : 0;
	}
}
