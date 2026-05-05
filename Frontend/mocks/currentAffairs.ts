export interface CurrentAffair {
  id: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  source: string;
  importance: 'high' | 'medium' | 'low';
  tags: string[];
}

export const currentAffairs: CurrentAffair[] = [
  {
    id: '1',
    title: 'Union Budget 2026 Highlights',
    summary: 'Finance Minister announces key allocations for infrastructure, education, and healthcare sectors.',
    category: 'Economy',
    date: '2026-02-15',
    source: 'The Hindu',
    importance: 'high',
    tags: ['Budget', 'Economy', 'Policy'],
  },
  {
    id: '2',
    title: 'Climate Summit Outcomes',
    summary: 'India commits to enhanced renewable energy targets at international climate conference.',
    category: 'Environment',
    date: '2026-02-14',
    source: 'Indian Express',
    importance: 'high',
    tags: ['Environment', 'International Relations'],
  },
  {
    id: '3',
    title: 'Digital India Initiative Expansion',
    summary: 'Government launches new phase of digitalization focusing on rural connectivity.',
    category: 'Technology',
    date: '2026-02-13',
    source: 'The Hindu',
    importance: 'medium',
    tags: ['Technology', 'Governance'],
  },
  {
    id: '4',
    title: 'Supreme Court Ruling on Privacy',
    summary: 'Landmark judgment strengthens data protection rights for citizens.',
    category: 'Polity',
    date: '2026-02-12',
    source: 'Indian Express',
    importance: 'high',
    tags: ['Judiciary', 'Rights'],
  },
  {
    id: '5',
    title: 'New Education Policy Updates',
    summary: 'Implementation guidelines released for NEP 2020 in higher education institutions.',
    category: 'Social Issues',
    date: '2026-02-11',
    source: 'The Hindu',
    importance: 'medium',
    tags: ['Education', 'Policy'],
  },
];
