import type { Rol } from '../types';
import { supabase } from './supabaseClient';

export async function iniciarSesion(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function cerrarSesion(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function obtenerRol(userId: string): Promise<Rol> {
  if (!supabase) return 'viewer';
  const { data, error } = await supabase.from('perfiles').select('rol').eq('id', userId).single();
  if (error || !data) return 'viewer';
  return data.rol === 'admin' ? 'admin' : 'viewer';
}
