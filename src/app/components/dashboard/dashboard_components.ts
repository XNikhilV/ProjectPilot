import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { Project } from '../../models/project.model';
import { Task } from '../../models/task.model';
import { ProjectListComponent } from './project-list.component';
import { TaskBoardComponent } from './task-board.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ProjectListComponent, TaskBoardComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Task Manager</h1>
              <p class="text-gray-600">Welcome back, {{ currentUser?.name }}!</p>
            </div>
            <div class="flex items-center space-x-4">
              <button
                (click)="showProjectForm = true"
                class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                New Project
              </button>
              <button
                (click)="logout()"
                class="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span class="text-white text-sm font-bold">P</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ projects.length }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span class="text-white text-sm font-bold">T</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">To Do</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ getTasksByStatus('todo').length }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span class="text-white text-sm font-bold">P</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ getTasksByStatus('in-progress').length }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span class="text-white text-sm font-bold">D</span>
                    </div>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Done</dt>
                      <dd class="text-lg font-medium text-gray-900">{{ getTasksByStatus('done').length }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Content Tabs -->
          <div class="bg-white shadow rounded-lg">
            <div class="border-b border-gray-200">
              <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                <button
                  (click)="activeTab = 'projects'"
                  [class]="activeTab === 'projects' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                >
                  Projects
                </button>
                <button
                  (click)="activeTab = 'board'"
                  [class]="activeTab === 'board' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                  class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                >
                  Task Board
                </button>
              </nav>
            </div>

            <div class="p-6">
              <app-project-list
                *ngIf="activeTab === 'projects'"
                [projects]="projects"
                [showForm]="showProjectForm"
                (projectCreated)="onProjectCreated($event)"
                (projectUpdated)="onProjectUpdated($event)"
                (projectDeleted)="onProjectDeleted($event)"
                (formClosed)="showProjectForm = false"
              ></app-project-list>

              <app-task-board
                *ngIf="activeTab === 'board'"
                [projects]="projects"
                [tasks]="tasks"
                (taskCreated)="onTaskCreated($event)"
                (taskUpdated)="onTaskUpdated($event)"
                (taskDeleted)="onTaskDeleted($event)"
              ></app-task-board>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  currentUser = this.authService.getCurrentUser();
  projects: Project[] = [];
  tasks: Task[] = [];
  activeTab: 'projects' | 'board' = 'projects';
  showProjectForm = false;

  constructor(
    private authService: AuthService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.loadTasks();
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (error) => {
        console.error('Failed to load projects:', error);
      }
    });
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
      },
      error: (error) => {
        console.error('Failed to load tasks:', error);
      }
    });
  }

  getTasksByStatus(status: string): Task[] {
    return this.tasks.filter(task => task.status === status);
  }

  onProjectCreated(project: Project): void {
    this.projects.unshift(project);
    this.showProjectForm = false;
  }

  onProjectUpdated(project: Project): void {
    const index = this.projects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      this.projects[index] = project;
    }
  }

  onProjectDeleted(projectId: string): void {
    this.projects = this.projects.filter(p => p.id !== projectId);
    this.tasks = this.tasks.filter(t => t.project_id !== projectId);
  }

  onTaskCreated(task: Task): void {
    this.tasks.unshift(task);
  }

  onTaskUpdated(task: Task): void {
    const index = this.tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      this.tasks[index] = task;
    }
  }

  onTaskDeleted(taskId: string): void {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}