'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import {
  Type,
  List,
  ListOrdered,
  FileText,
  Info,
  Table as TableIcon,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  Heart,
  Brain,
  Stethoscope
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Slide, ContentItem } from '@/types';

// Theme-aware gradient system for slides
const lightModeGradients = [
  'from-blue-400 via-blue-500 to-purple-600',
  'from-emerald-300 via-teal-400 to-blue-500', 
  'from-purple-400 via-pink-400 to-red-400',
  'from-amber-300 via-orange-400 to-red-500',
  'from-teal-300 via-cyan-400 to-blue-500',
  'from-rose-300 via-pink-400 to-purple-500',
  'from-indigo-400 via-purple-500 to-pink-500',
  'from-cyan-300 via-blue-400 to-indigo-500',
  'from-green-300 via-emerald-400 to-teal-500',
  'from-orange-300 via-red-400 to-pink-500',
  'from-violet-400 via-purple-500 to-indigo-600',
  'from-lime-300 via-green-400 to-emerald-500'
];

const darkModeGradients = [
  'from-blue-600 via-blue-700 to-purple-800',
  'from-emerald-500 via-teal-600 to-blue-700', 
  'from-purple-600 via-pink-600 to-red-600',
  'from-amber-500 via-orange-600 to-red-700',
  'from-teal-500 via-cyan-600 to-blue-700',
  'from-rose-500 via-pink-600 to-purple-700',
  'from-indigo-600 via-purple-700 to-pink-700',
  'from-cyan-500 via-blue-600 to-indigo-700',
  'from-green-500 via-emerald-600 to-teal-700',
  'from-orange-500 via-red-600 to-pink-700',
  'from-violet-600 via-purple-700 to-indigo-800',
  'from-lime-500 via-green-600 to-emerald-700'
];

// Medical-themed accent colors for content sections
const contentAccents = {
  paragraph: 'text-blue-100 bg-blue-500/20',
  bullet_list: 'text-emerald-100 bg-emerald-500/20',
  numbered_list: 'text-purple-100 bg-purple-500/20',
  table: 'text-orange-100 bg-orange-500/20',
  note: 'text-amber-100 bg-amber-500/20'
};

// Medical icons for different content types
const medicalIcons = {
  paragraph: Stethoscope,
  bullet_list: Heart,
  numbered_list: Brain,
  table: Users,
  note: Lightbulb
};

interface BoldRendererProps {
  text: string;
  bold?: string[];
  className?: string;
}

const BoldRenderer: React.FC<BoldRendererProps> = ({ text, bold = [], className = "" }) => {
  if (!text) return null;
  if (bold.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const boldEscaped = bold.map(b => b.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const regex = new RegExp(`(${boldEscaped.join('|')})`, 'g');
  const parts = text.split(regex).filter(Boolean);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        bold.includes(part) ? 
          <strong key={i} className="font-bold text-white drop-shadow-sm">{part}</strong> : 
          part
      )}
    </span>
  );
};

interface ContentItemRendererProps {
  item: ContentItem;
  index: number;
  slideIndex: number;
}

const ContentItemRenderer: React.FC<ContentItemRendererProps> = ({ item, index, slideIndex }) => {
  const IconComponent = medicalIcons[item.type as keyof typeof medicalIcons] || FileText;
  const accentClass = contentAccents[item.type as keyof typeof contentAccents] || contentAccents.paragraph;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: index * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
        
        {/* Content Type Indicator */}
        <div className={`absolute top-2 sm:top-3 left-2 sm:left-3 p-1.5 sm:p-2 rounded-lg ${accentClass} transition-all duration-300 group-hover:scale-110`}>
          <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
        </div>

        <div className="pl-10 sm:pl-14 pr-3 sm:pr-4 py-3 sm:py-4">
          {item.type === 'paragraph' && (
            <div className="prose prose-invert max-w-none">
              <p className="text-white/90 text-base leading-relaxed font-medium">
                <BoldRenderer text={item.text} bold={item.bold} />
              </p>
            </div>
          )}

          {item.type === 'bullet_list' && (
            <ul className="space-y-3">
              {item.items.map((listItem, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index * 0.1) + (i * 0.05) }}
                  className="flex items-start gap-3 text-white/90"
                >
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2.5 flex-shrink-0 shadow-sm"></div>
                  <span className="text-base leading-relaxed font-medium">
                    <BoldRenderer text={listItem.text} bold={listItem.bold} />
                  </span>
                </motion.li>
              ))}
            </ul>
          )}

          {item.type === 'numbered_list' && (
            <ol className="space-y-3">
              {item.items.map((listItem, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index * 0.1) + (i * 0.05) }}
                  className="flex items-start gap-3 text-white/90"
                >
                  <div className="w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm">
                    {i + 1}
                  </div>
                  <span className="text-base leading-relaxed font-medium pt-1">
                    <BoldRenderer text={listItem.text} bold={listItem.bold} />
                  </span>
                </motion.li>
              ))}
            </ol>
          )}

          {item.type === 'table' && (
            <div className="rounded-lg overflow-hidden bg-white/5 border border-white/20">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20 bg-white/10">
                    {item.headers.map((header, i) => (
                      <TableHead key={i} className="text-white font-bold text-sm border-white/20">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.rows.map((row, i) => (
                    <TableRow key={i} className="border-white/10 hover:bg-white/5">
                      {row.cells.map((cell, j) => (
                        <TableCell key={j} className="text-white/90 text-sm border-white/10">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {item.type === 'note' && (
            <div className="relative">
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-300 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-100 text-sm font-medium leading-relaxed">
                    <span className="font-bold">Note: </span>
                    {item.text.replace(/^Note:\s*/i, '')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface EnhancedSlideRendererProps {
  slide: Slide;
  index: number;
  isSelected?: boolean;
  isLoading?: boolean;
  isDissolving?: boolean;
  onDissolveComplete?: () => void;
}

export const EnhancedSlideRenderer: React.FC<EnhancedSlideRendererProps> = ({ 
  slide, 
  index, 
  isSelected = false,
  isLoading = false,
  isDissolving = false,
  onDissolveComplete
}) => {
  const { theme } = useTheme();
  
  const isDark = theme === 'dark';
  const slideGradients = isDark ? darkModeGradients : lightModeGradients;
  const gradientClass = slideGradients[index % slideGradients.length];
  
  const slideVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: {
      x: '100%',
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  // Show loading state if slide has no content or if explicitly loading
  const showLoadingState = isLoading || slide.content.length === 0;

  if (showLoadingState) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass} shadow-2xl border border-white/20`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="relative p-8 min-h-[400px]">
          {/* Slide Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-12 bg-white/80 rounded-full shadow-sm"></div>
              <div>
                <div className="text-white/60 text-sm font-medium mb-1">Slide {index + 1}</div>
                <h2 className="text-2xl font-bold text-white leading-tight drop-shadow-sm">
                  {slide.title}
                </h2>
              </div>
            </div>
          </div>
          
          {/* Loading Animation */}
          <div className="animate-pulse space-y-6">
            <div className="text-white/70 text-lg mb-4">Generating content...</div>
            <div className="space-y-4">
              <div className="h-4 bg-white/15 rounded w-full"></div>
              <div className="h-4 bg-white/15 rounded w-4/5"></div>
              <div className="h-4 bg-white/15 rounded w-3/5"></div>
              <div className="h-4 bg-white/15 rounded w-2/3"></div>
            </div>
            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400/50 rounded-full"></div>
                <div className="h-3 bg-white/10 rounded w-4/5"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400/50 rounded-full"></div>
                <div className="h-3 bg-white/10 rounded w-3/5"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400/50 rounded-full"></div>
                <div className="h-3 bg-white/10 rounded w-5/6"></div>
              </div>
            </div>
          </div>
          
          {/* Floating Animation Elements */}
          <div className="absolute top-4 right-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full"
            />
          </div>
          
          {/* Slide Number Badge */}
          <div className="absolute bottom-4 right-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/30">
              <span className="text-white/80 text-sm font-medium">{index + 1}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if this slide is being refreshed (has content but is loading)
  const isRefreshing = isLoading && slide.content.length > 0;

  return (
    <motion.div
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass} shadow-2xl hover:shadow-3xl transition-all duration-500 border ${isDark ? 'border-white/10' : 'border-black/10'} ${
        isSelected ? `ring-4 ${isDark ? 'ring-white/40' : 'ring-black/20'} scale-[1.02]` : ''
      }`}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-black/30 via-transparent to-white/5' : 'from-black/10 via-transparent to-white/20'}`}></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-12 -translate-x-12"></div>
      
      {/* Content Container */}
      <div className="relative p-4 sm:p-6 lg:p-8 min-h-[320px] sm:min-h-[400px]">
        {/* Slide Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 sm:h-12 bg-white/80 rounded-full shadow-sm"></div>
            <div>
              <div className="text-white/60 text-xs sm:text-sm font-medium mb-1">Slide {index + 1}</div>
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight drop-shadow-sm break-words">
                {slide.title}
              </h2>
            </div>
          </div>
        </motion.div>

        {/* Content Items */}
        <motion.div className="space-y-4 sm:space-y-6">
          {slide.content.map((item, contentIndex) => (
            <ContentItemRenderer
              key={contentIndex}
              item={item}
              index={contentIndex}
              slideIndex={index}
            />
          ))}
        </motion.div>

        {/* Slide Number Badge */}
        <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 border border-white/30">
            <span className="text-white/80 text-xs sm:text-sm font-medium">{index + 1}</span>
          </div>
        </div>
      </div>
      
      {/* Innovative Shimmer Overlay for Refresh/Expand */}
      {isRefreshing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10"
        >
          <div className="relative overflow-hidden w-full h-full rounded-2xl">
            {/* Scanning Line Effect */}
            <motion.div
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
              className="absolute inset-y-0 w-1 bg-gradient-to-b from-transparent via-white to-transparent opacity-80"
            />
            
            {/* Pulsing Dots */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                    className="w-3 h-3 bg-white rounded-full"
                  />
                ))}
              </div>
            </div>
            
            {/* Status Text */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30"
              >
                <span className="text-white text-sm font-medium">
                  Regenerating content...
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EnhancedSlideRenderer;
