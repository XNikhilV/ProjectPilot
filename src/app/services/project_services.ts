import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.API_URL}/projects`);
  }

  createProject(project: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(`${this.API_URL}/projects`, project);
  }

  updateProject(id: string, project: UpdateProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.API_URL}/projects/${id}`, project);
  }

  deleteProject(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/projects/${id}`);
  }
}