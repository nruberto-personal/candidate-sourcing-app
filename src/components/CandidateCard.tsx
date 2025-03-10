import React from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { Check, X, ExternalLink } from 'lucide-react';
import type { Candidate } from '../types';

interface Props {
  candidate: Candidate;
  onAccept: () => void;
  onReject: () => void;
  isLoading?: boolean;
}

export default function CandidateCard({ candidate, onAccept, onReject, isLoading }: Props) {
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) onAccept();
    else if (info.offset.x < -100) onReject();
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="animate-pulse">
            <div className="flex p-6 gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-gray-200" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-6 w-16 bg-gray-200 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-4 p-4 bg-gray-50">
              <div className="w-16 h-16 rounded-full bg-gray-200" />
              <div className="w-16 h-16 rounded-full bg-gray-200" />
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key={candidate.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.05 }}
        >
          <div className="flex p-6 gap-6">
            <div className="flex-shrink-0">
              <img
                src={candidate.profilePic}
                alt={candidate.name}
                className="w-32 h-32 rounded-full object-cover"
              />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
                <a
                  href={candidate.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
              
              <p className="text-gray-600 mb-4">{candidate.summary}</p>
              
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(candidate.skills)).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Why This Candidate?</h3>
                <p className="text-gray-700">{candidate.justification}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4 p-4 bg-gray-50">
            <button
              onClick={onReject}
              className="p-4 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <button
              onClick={onAccept}
              className="p-4 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
            >
              <Check className="w-8 h-8" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}