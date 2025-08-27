export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProjectRequest {
  name: string;
  description?: string;
  color?: string;
}