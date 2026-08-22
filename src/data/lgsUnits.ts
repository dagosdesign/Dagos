// LGS curriculum units. Each unit has its own flashcard category so word
// batches can be imported per unit (same pipeline as the other categories).
export interface LgsUnit {
  id: string;
  title: string;
  titleTr: string;
  category: string;
}

export const LGS_UNITS: LgsUnit[] = [
  { id: 'friendship', title: 'Friendship', titleTr: 'Arkadaşlık', category: 'LGS · Friendship' },
  { id: 'teen-life', title: 'Teen Life', titleTr: 'Genç Yaşamı', category: 'LGS · Teen Life' },
  { id: 'in-the-kitchen', title: 'In the Kitchen', titleTr: 'Mutfakta', category: 'LGS · In the Kitchen' },
  { id: 'on-the-phone', title: 'On the Phone', titleTr: 'Telefonda', category: 'LGS · On the Phone' },
  { id: 'the-internet', title: 'The Internet', titleTr: 'İnternet', category: 'LGS · The Internet' },
  { id: 'adventures', title: 'Adventures', titleTr: 'Maceralar', category: 'LGS · Adventures' },
  { id: 'tourism', title: 'Tourism', titleTr: 'Turizm', category: 'LGS · Tourism' },
  { id: 'chores', title: 'Chores', titleTr: 'Ev İşleri', category: 'LGS · Chores' },
  { id: 'science', title: 'Science', titleTr: 'Bilim', category: 'LGS · Science' },
  { id: 'natural-forces', title: 'Natural Forces', titleTr: 'Doğal Afetler', category: 'LGS · Natural Forces' },
  { id: 'all-units', title: 'All Units', titleTr: 'Genel Kelime Havuzu', category: 'LGS · All Units' },
];
