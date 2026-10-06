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

export interface Perfil {
  rol: Rol;
  avatarUrl: string | null;
}

export async function obtenerPerfil(userId: string): Promise<Perfil> {
  if (!supabase) return { rol: 'viewer', avatarUrl: null };
  const { data, error } = await supabase.from('perfiles').select('rol, avatar_url').eq('id', userId).single();
  if (error || !data) return { rol: 'viewer', avatarUrl: null };
  return { rol: data.rol === 'admin' ? 'admin' : 'viewer', avatarUrl: data.avatar_url ?? null };
}

export async function cambiarPassword(nuevaPassword: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
  if (error) throw error;
}

const BUCKET_AVATARS = 'avatars';

/** Sube el avatar del usuario a su propia carpeta en el bucket y actualiza perfiles.avatar_url. */
export async function subirAvatar(file: File, userId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const MAX_BYTES = 3 * 1024 * 1024;
  if (file.size > MAX_BYTES) throw new Error('La imagen pesa más de 3 MB. Elegí una más liviana.');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error: subError } = await supabase.storage.from(BUCKET_AVATARS).upload(path, file, { contentType: file.type, upsert: true });
  if (subError) throw new Error(`No se pudo subir la imagen: ${subError.message}`);
  const { data } = supabase.storage.from(BUCKET_AVATARS).getPublicUrl(path);
  const url = data.publicUrl;
  const { error: updError } = await supabase.from('perfiles').update({ avatar_url: url }).eq('id', userId);
  if (updError) throw new Error(`No se pudo guardar el avatar: ${updError.message}`);
  return url;
}
