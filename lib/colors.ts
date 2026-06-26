export interface ColorDefinition {
  name: string;
  hex: string;
}

export const COLOR_DATABASE: ColorDefinition[] = [
  { name: 'Negro', hex: '#1A1A1A' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Gris', hex: '#808080' },
  { name: 'Gris Oscuro', hex: '#4B5563' },
  { name: 'Gris Claro', hex: '#D1D5DB' },
  { name: 'Beige', hex: '#EEDC82' },
  { name: 'Arena', hex: '#E6C280' },
  { name: 'Hueso', hex: '#F9F6EE' },
  { name: 'Crema', hex: '#FFFDD0' },
  { name: 'Rojo', hex: '#EF4444' },
  { name: 'Vino', hex: '#7F1D1D' },
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Azul Marino', hex: '#1E3A8A' },
  { name: 'Celeste', hex: '#38BDF8' },
  { name: 'Verde', hex: '#22C55E' },
  { name: 'Verde Militar', hex: '#3F6212' },
  { name: 'Verde Oliva', hex: '#606C38' },
  { name: 'Amarillo', hex: '#EAB308' },
  { name: 'Mostaza', hex: '#CA8A04' },
  { name: 'Naranja', hex: '#F97316' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Palo de Rosa', hex: '#D4A373' },
  { name: 'Morado', hex: '#8B5CF6' },
  { name: 'Café / Marrón', hex: '#78350F' },
];

export const COLOR_MAP: Record<string, string> = COLOR_DATABASE.reduce((acc, c) => {
  acc[c.name] = c.hex;
  return acc;
}, {} as Record<string, string>);
