export const sjlZones = [
  {
    id: 'zona-1',
    name: 'Zona 1 (La Entrada)',
    description: 'Zarate, Azcarrunz, Mangomarca y Campoy.',
  },
  {
    id: 'zona-2',
    name: 'Zona 2',
    description: 'Caja de Agua, Chacarilla de Otero, Las Flores de Lima y San Hilarion.',
  },
  {
    id: 'zona-3',
    name: 'Zona 3',
    description: 'Azcarrunz Alto, Urbanizacion Las Flores y Urbanizacion San Carlos.',
  },
  {
    id: 'zona-4',
    name: 'Zona 4',
    description: 'Canto Bello, UPIS Huascar, San Rafael y Pro Buenos Aires.',
  },
  {
    id: 'zona-5',
    name: 'Zona 5',
    description: 'Canto Rey, Canto Grande, El Arenal de Canto Grande y El Porvenir.',
  },
  {
    id: 'zona-6',
    name: 'Zona 6',
    description: 'Mariscal Caceres y AA.HH. Cruz de Motupe.',
  },
  {
    id: 'zona-7',
    name: 'Zona 7 (La Parte Alta)',
    description: 'Mariscal Ramon Castilla, 10 de Octubre y Ciudad Mariscal Caceres.',
  },
  {
    id: 'zona-8',
    name: 'Zona 8 (El Limite)',
    description: 'Jicamarca, Anexo 22 y limite este.',
  },
];

export function zoneLabel(zoneId?: string) {
  return sjlZones.find((zone) => zone.id === zoneId)?.name ?? 'San Juan de Lurigancho';
}
