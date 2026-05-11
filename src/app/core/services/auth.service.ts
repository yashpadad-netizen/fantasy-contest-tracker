import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/models';

interface AuthRecord {
  id: string;
  name: string;
  isAdmin: boolean;
  username: string;
  passwordHash: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authSeed: AuthRecord[] = [
    {
      id: '1',
      name: 'Admin',
      isAdmin: true,
      username: 'admin',
      passwordHash: '9a0c5eb0b0cd3658d3aeefc41a63d8923264f5b454106bfa9a21fce9e29db989'
    },
    {
      id: '2',
      name: 'User',
      isAdmin: false,
      username: 'user',
      passwordHash: '3e7c19576488862816f13b512cacf3e4ba97dd97243ea0bd6a2ad1642d86ba72'
    }
  ];

  private currentUser: User | null = null;

  constructor(private router: Router) {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      this.currentUser = JSON.parse(userJson);
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    const normalizedUsername = username.trim().toLowerCase();
    const account = this.authSeed.find((record) => record.username === normalizedUsername);
    if (!account) {
      return false;
    }

    const enteredHash = await this.hashPassword(password);
    if (enteredHash !== account.passwordHash) {
      return false;
    }

    this.currentUser = { id: account.id, name: account.name, isAdmin: account.isAdmin };
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    return true;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  isAdmin(): boolean {
    return this.currentUser?.isAdmin ?? false;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  private async hashPassword(password: string): Promise<string> {
    const payload = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', payload);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
}
