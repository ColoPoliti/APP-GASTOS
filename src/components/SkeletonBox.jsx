// src/components/SkeletonBox.jsx
export default function SkeletonBox({ className = "" }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`} 
      style={{ animationDuration: '1.5s' }}
    />
  );
}