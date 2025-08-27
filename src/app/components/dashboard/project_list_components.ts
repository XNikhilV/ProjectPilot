import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Project Form Modal -->
    <div *ngIf="showForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            {{ editingProject ? 'Edit Project' : 'Create New Project' }}
          </h3>
          <form [formGroup]="projectForm" (ngSubmit)="onSubmit()">
            <div class="space-y-4">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700">Project Name</label>
                <input
                  type="text"
                  id="name"
                  formControlName="name"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description"
                  formControlName="description"
                  rows="3"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter project description"
                ></textarea>
              </div>
              <div>
                <label for="color" class="block text-sm font-medium text-gray-700">Color</label>
                <div class="mt-1 flex space-x-2">
                  <div *ngFor="let colorOption of colorOptions" 
                       (click)="selectColor(colorOption)"
                       [class]="'w-8 h-8 rounded-full cursor-pointer border-2 ' + (projectForm.get('color')?.value === colorOption ? 'border-gray-800' : 'border-gray-300')"
                       [style.background-color]="colorOption">
                  </div>
                </div>
              </div>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                (click)="closeForm()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="projectForm.invalid || loading"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 transition-colors"
              >
                {{ loading ? 'Saving...' : (editingProject ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Projects Grid -->
    <div *ngIf="!showForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div *ngFor="let project of projects" class="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div 
                class="w-4 h-4 rounded-full mr-3"
                [style.background-color]="project.color">
              </div>
              <h3 class="text-lg font-medium text-gray-900">{{ project.name }}</h3>
            </div>
            <div class="flex space-x-2">
              <button
                (click)="editProject(project)"
                class="text-gray-400 hover:text-indigo-600 transition-colors"
                title="Edit project"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </button>
              <button
                (click)="deleteProject(project.id)"
                class="text-gray-400 hover:text-red-600 transition-colors"
                title="Delete project"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
          <p class="text-gray-600 text-sm mb-4">{{ project.description || 'No description' }}</p>
          <div class="text-xs text-gray-500">
            Created {{ formatDate(project.created_at) }}
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="projects.length === 0" class="col-span-full text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No projects</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
      </div>
    </div>
  `
})
export class ProjectListComponent {
  @Input() projects: Project[] = [];
  @Input() showForm = false;
  @Output() projectCreated = new EventEmitter<Project>();
  @Output() projectUpdated = new EventEmitter<Project>();
  @Output() projectDeleted = new EventEmitter<string>();
  @Output() formClosed = new EventEmitter<void>();

  projectForm: FormGroup;
  editingProject: Project | null = null;
  loading = false;

  colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      color: ['#3B82F6']
    });
  }

  ngOnChanges(): void {
    if (this.showForm && !this.editingProject) {
      this.resetForm();
    }
  }

  selectColor(color: string): void {
    this.projectForm.patchValue({ color });
  }

  editProject(project: Project): void {
    this.editingProject = project;
    this.projectForm.patchValue({
      name: project.name,
      description: project.description,
      color: project.color
    });
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      this.loading = true;
      const formData = this.projectForm.value;

      if (this.editingProject) {
        this.projectService.updateProject(this.editingProject.id, formData).subscribe({
          next: (project) => {
            this.projectUpdated.emit(project);
            this.closeForm();
          },
          error: (error) => {
            console.error('Failed to update project:', error);
            this.loading = false;
          }
        });
      } else {
        this.projectService.createProject(formData).subscribe({
          next: (project) => {
            this.projectCreated.emit(project);
            this.closeForm();
          },
          error: (error) => {
            console.error('Failed to create project:', error);
            this.loading = false;
          }
        });
      }
    }
  }

  deleteProject(projectId: string): void {
    if (confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
      this.projectService.deleteProject(projectId).subscribe({
        next: () => {
          this.projectDeleted.emit(projectId);
        },
        error: (error) => {
          console.error('Failed to delete project:', error);
        }
      });
    }
  }

  closeForm(): void {
    this.resetForm();
    this.editingProject = null;
    this.loading = false;
    this.formClosed.emit();
  }

  private resetForm(): void {
    this.projectForm.reset({
      name: '',
      description: '',
      color: '#3B82F6'
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}