/**
 * Custom hooks for canvas export functionality.
 * Supports saving as PNG image and PDF document.
 */

import { useCallback } from 'react';
import Konva from 'konva';
import { jsPDF } from 'jspdf';

interface UseExportReturn {
  saveAsImage: (stage: Konva.Stage, filename?: string) => void;
  saveAsPDF: (stage: Konva.Stage, filename?: string) => void;
}

export const useExport = (): UseExportReturn => {
  const saveAsImage = useCallback((stage: Konva.Stage, filename = 'whiteboard.png') => {
    const dataUrl = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const saveAsPDF = useCallback((stage: Konva.Stage, filename = 'whiteboard.pdf') => {
    const dataUrl = stage.toDataURL({ pixelRatio: 2 });
    const width = stage.width();
    const height = stage.height();

    const orientation = width > height ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [width, height],
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
    pdf.save(filename);
  }, []);

  return { saveAsImage, saveAsPDF };
};
