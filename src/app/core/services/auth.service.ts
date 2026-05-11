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
      passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
    },
    {
      id: '2',
      name: 'User',
      isAdmin: false,
      username: 'user',
      passwordHash: '04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb'
    }
  ];
  private currentUser: User | null = null;

  constructor(private router: Router) {
    // Load from localStorage on init
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
