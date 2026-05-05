export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  totalTopics: number;
  completedTopics: number;
  color: string;
}

export const modules: Module[] = [
  {
    id: '1',
    title: 'History',
    description: 'Ancient, Medieval & Modern India',
    icon: 'BookOpen',
    progress: 65,
    totalTopics: 45,
    completedTopics: 29,
    color: '#E91E63',
  },
  {
    id: '2',
    title: 'Geography',
    description: 'Physical, Human & Economic',
    icon: 'Globe',
    progress: 42,
    totalTopics: 38,
    completedTopics: 16,
    color: '#2196F3',
  },
  {
    id: '3',
    title: 'Polity',
    description: 'Indian Constitution & Governance',
    icon: 'Scale',
    progress: 78,
    totalTopics: 52,
    completedTopics: 41,
    color: '#FF9800',
  },
  {
    id: '4',
    title: 'Economy',
    description: 'Indian & World Economy',
    icon: 'TrendingUp',
    progress: 55,
    totalTopics: 40,
    completedTopics: 22,
    color: '#4CAF50',
  },
  {
    id: '5',
    title: 'Environment',
    description: 'Ecology & Biodiversity',
    icon: 'Leaf',
    progress: 30,
    totalTopics: 28,
    completedTopics: 8,
    color: '#009688',
  },
  {
    id: '6',
    title: 'Science & Tech',
    description: 'General Science & Technology',
    icon: 'Cpu',
    progress: 48,
    totalTopics: 35,
    completedTopics: 17,
    color: '#9C27B0',
  },
];
