/**
 * UI Component Barrel File
 * 
 * This file provides a consistent API for importing UI components
 * and helps resolve case-sensitivity issues on case-sensitive filesystems
 */

// Export components from the actual UI directory
export { Button } from '../ui/Button';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
export { PageHeader } from '../ui/PageHeader';
export { Spinner } from '../ui/Spinner';
export { Toast, ToastAction, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '../ui/Toast';

// Also export from use-toast.ts
export { toast, useToast } from '../ui/use-toast'; 