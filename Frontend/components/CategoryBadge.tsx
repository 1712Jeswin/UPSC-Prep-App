import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface CategoryBadgeProps {
  category: string;
}

const categoryStyles: Record<string, string> = {
  "Polity": "#3B82F6",
  "Economy": "#10B981",
  "Environment": "#22C55E",
  "IR": "#8B5CF6",
  "Sci-Tech": "#F59E0B",
  "Social Justice": "#EF4444",
  "Internal Security": "#6B7280"
};

const categoryIcons: Record<string, string> = {
  "Polity": "balance-scale",
  "Economy": "chart-line",
  "Environment": "leaf",
  "IR": "globe",
  "Sci-Tech": "microchip",
  "Social Justice": "users",
  "Internal Security": "shield-alt"
};

const getCategoryKey = (category: string): string => {
  if (!category) return "Fallback";
  const trimmed = category.trim().toLowerCase();
  if (trimmed.includes("polity") || trimmed.includes("governance")) return "Polity";
  if (trimmed.includes("economy") || trimmed.includes("economic") || trimmed.includes("finance")) return "Economy";
  if (trimmed.includes("environment") || trimmed.includes("ecology") || trimmed.includes("disaster") || trimmed.includes("climate")) return "Environment";
  if (trimmed.includes("ir") || trimmed.includes("international") || trimmed.includes("foreign") || trimmed.includes("relations")) return "IR";
  if (trimmed.includes("sci") || trimmed.includes("tech") || trimmed.includes("science") || trimmed.includes("space")) return "Sci-Tech";
  if (trimmed.includes("social") || trimmed.includes("justice") || trimmed.includes("society") || trimmed.includes("welfare")) return "Social Justice";
  if (trimmed.includes("security") || trimmed.includes("defense") || trimmed.includes("internal")) return "Internal Security";
  
  // Try to match exact key case-insensitively
  const exactMatch = Object.keys(categoryStyles).find(
    key => key.toLowerCase() === trimmed
  );
  return exactMatch || "Fallback";
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const key = getCategoryKey(category);
  const color = categoryStyles[key] || "#9CA3AF";
  const iconName = categoryIcons[key] || "newspaper";

  return (
    <View style={[styles.badgeContainer, { backgroundColor: `${color}15` }]}>
      <FontAwesome5 name={iconName} size={20} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CategoryBadge;
