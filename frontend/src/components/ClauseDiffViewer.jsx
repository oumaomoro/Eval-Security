import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';

export default function ClauseDiffViewer({ originalText, redlineText }) {
  if (!originalText || !redlineText) return null;

  const newStyles = {
    variables: {
      light: {
        diffViewerBackground: '#ffffff',
        diffViewerColor: '#0f172a',
        addedBackground: '#f0fdf4',
        addedColor: '#166534',
        removedBackground: '#fff1f2',
        removedColor: '#9f1239',
        wordAddedBackground: '#dcfce7',
        wordRemovedBackground: '#ffe4e6',
        addedGutterBackground: '#f0fdf4',
        removedGutterBackground: '#fff1f2',
        gutterBackground: '#f8fafc',
        gutterBackgroundDark: '#f1f5f9',
        highlightBackground: '#fffbeb',
        highlightGutterBackground: '#fef3c7',
        codeFoldGutterBackground: '#f8fafc',
        codeFoldBackground: '#f8fafc',
        emptyLineBackground: '#ffffff',
        gutterColor: '#64748b',
        addedGutterColor: '#166534',
        removedGutterColor: '#9f1239',
        codeFoldContentColor: '#64748b',
        diffViewerTitleBackground: '#f1f5f9',
        diffViewerTitleColor: '#334155',
        diffViewerTitleBorderColor: '#e2e8f0'
      }
    },
    titleBlock: {
      fontWeight: 'bold',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      padding: '8px 12px'
    }
  };

  return (
    <div className="mt-4 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-300 text-[11px] lg:text-xs text-left">
      <ReactDiffViewer 
        oldValue={originalText} 
        newValue={redlineText} 
        splitView={true}
        hideLineNumbers={true}
        leftTitle="Original Contract Clause"
        rightTitle="Optimized AI Redline"
        styles={newStyles}
      />
    </div>
  );
}
