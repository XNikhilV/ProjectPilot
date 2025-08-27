import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { routes } from './app/app.routes';
import { AuthInterceptor } from './app/interceptors/auth.interceptor';
import { AuthService } from './app/services/auth.service';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
  `,
  imports: []
})
export class App {
  constructor(private authService: AuthService) {}
}

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      (req, next) => {
        const authService = new AuthService(null as any);
        const token = authService.getToken();
        
        if (token) {
          const authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
          });
          return next(authReq);
        }
        
        return next(req);
      }
    ])),
    importProvidersFrom(
      ReactiveFormsModule,
      FormsModule,
      BrowserAnimationsModule
    )
  ]
});