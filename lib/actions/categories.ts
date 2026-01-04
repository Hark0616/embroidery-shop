'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'

export async function getCategories() {
  const supabase = await createClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data
}

export async function getCategoriesWithParent() {
  const supabase = await createClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      parent:categories!parent_id(id, name, slug)
    `)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data
}

export async function createCategory(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase no configurado' }

  const name = formData.get('name') as string
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const category = {
    name,
    slug,
    parent_id: formData.get('parent_id') as string || null,
    order_index: parseInt(formData.get('order_index') as string) || 0,
  }

  const { error } = await supabase.from('categories').insert(category as any)

  if (error) {
    console.error('Error creating category:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/categorias')
  revalidatePath('/')
  return { success: true }
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase no configurado' }

  const name = formData.get('name') as string
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const category = {
    name,
    slug,
    parent_id: formData.get('parent_id') as string || null,
    order_index: parseInt(formData.get('order_index') as string) || 0,
  }

  const { error } = await supabase
    .from('categories')
    .update(category as any)
    .eq('id', id)

  if (error) {
    console.error('Error updating category:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/categorias')
  revalidatePath('/')
  return { success: true }
}

export async function deleteCategory(id: string) {
  await requireAdmin()
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase no configurado' }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/categorias')
  revalidatePath('/')
  return { success: true }
}

