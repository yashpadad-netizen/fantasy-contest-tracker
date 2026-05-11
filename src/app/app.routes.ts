import { Routes } from '@angular/router';
import { AuthGuard, AdminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'contests', loadComponent: () => import('./contest-list/contest-list.component').then(m => m.ContestListComponent), canActivate: [AuthGuard] },
  { path: 'contests/new', loadComponent: () => import('./create-contest/create-contest.component').then(m => m.CreateContestComponent), canActivate: [AdminGuard] },
  { path: 'contests/:id', loadComponent: () => import('./contest-detail/contest-detail.component').then(m => m.ContestDetailComponent), canActivate: [AuthGuard] },
  { path: 'contests/:id/results', loadComponent: () => import('./contest-results/contest-results.component').then(m => m.ContestResultsComponent), canActivate: [AdminGuard] },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [AuthGuard] },
];
