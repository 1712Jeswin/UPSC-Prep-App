export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  year?: string;
}

export const questions: Question[] = [
  {
    id: '1',
    question: 'Which Article of the Indian Constitution deals with the Right to Freedom of Religion?',
    options: [
      'Articles 25-28',
      'Articles 19-22',
      'Articles 14-18',
      'Articles 29-30',
    ],
    correctAnswer: 0,
    explanation: 'Articles 25-28 of the Indian Constitution guarantee the Right to Freedom of Religion, which includes freedom of conscience and free profession, practice and propagation of religion.',
    category: 'Polity',
    difficulty: 'medium',
    year: '2023',
  },
  {
    id: '2',
    question: 'The term "Fiscal Deficit" refers to:',
    options: [
      'Total revenue - Total expenditure',
      'Total expenditure - Total revenue excluding borrowings',
      'Revenue expenditure - Revenue receipts',
      'Capital expenditure - Capital receipts',
    ],
    correctAnswer: 1,
    explanation: 'Fiscal Deficit is the difference between total expenditure and total revenue excluding borrowings. It indicates the amount the government needs to borrow to meet its expenses.',
    category: 'Economy',
    difficulty: 'medium',
    year: '2022',
  },
  {
    id: '3',
    question: 'Who was the first Indian woman to become the President of the Indian National Congress?',
    options: [
      'Sarojini Naidu',
      'Annie Besant',
      'Indira Gandhi',
      'Vijaya Lakshmi Pandit',
    ],
    correctAnswer: 1,
    explanation: 'Annie Besant was the first woman to become the President of the Indian National Congress in 1917. Sarojini Naidu was the first Indian woman to hold this position in 1925.',
    category: 'History',
    difficulty: 'hard',
    year: '2021',
  },
  {
    id: '4',
    question: 'The Western Ghats are classified as which type of biodiversity hotspot?',
    options: [
      'Marine biodiversity hotspot',
      'Terrestrial biodiversity hotspot',
      'Freshwater biodiversity hotspot',
      'Desert biodiversity hotspot',
    ],
    correctAnswer: 1,
    explanation: 'The Western Ghats are classified as one of the terrestrial biodiversity hotspots of the world, known for high endemism and rich species diversity.',
    category: 'Environment',
    difficulty: 'easy',
    year: '2024',
  },
];
