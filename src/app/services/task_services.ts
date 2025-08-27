import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus, TaskPriority } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getTasks(filters?: {
    project_id?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
  }): Observable<Task[]> {
    let params = new HttpParams();
    
    if (filters?.project_id) {
      params = params.set('project_id', filters.project_id);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.priority) {
      params = params.set('priority', filters.priority);
    }

    return this.http.get<Task[]>(`${this.API_URL}/tasks`, { params });
  }

  createTask(task: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(`${this.API_URL}/tasks`, task);
  }

  updateTask(id: string, task: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.API_URL}/tasks/${id}`, task);
  }

  deleteTask(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/tasks/${id}`);
  }
}