import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { User } from '../models/models';
import { API_BASE } from './api.config';

interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;

  constructor(private router: Router, private http: HttpClient) {
    this.loadSession();
  }

  private loadSession(): void {
    const sessionData = localStorage.getItem('authSession');
    if (!sessionData) {
      return;
    }

    try {
      const parsed = JSON.parse(sessionData) as { user: User; token: string };
      this.currentUser = parsed.user;
      this.token = parsed.token;
    } catch {
      this.currentUser = null;
      this.token = null;
    }
  }

  private saveSession(): void {
    if (this.currentUser && this.token) {
      localStorage.setItem('authSession', JSON.stringify({ user: this.currentUser, token: this.token }));
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${API_BASE}/auth/login`, {
          username: username.trim(),
          password
        })
      );
      this.currentUser = response.user;
      this.token = response.token;
      this.saveSession();
      return true;
    } catch {
      return false;
    }
  }

  logout(): void {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem('authSession');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null && this.token !== null;
  }

  isAdmin(): boolean {
    return this.currentUser?.isAdmin ?? false;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.token;
  }
}
