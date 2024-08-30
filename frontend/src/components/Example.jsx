import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDFComparison = () => {
  const [originalPdf, setOriginalPdf] = useState(null);
  const [processedPdf, setProcessedPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);

  useEffect(() => {
    if (originalPdf) renderPDF(originalPdf, originalCanvasRef.current, currentPage);
    if (processedPdf) renderPDF(processedPdf, processedCanvasRef.current, currentPage);
  }, [originalPdf, processedPdf, currentPage]);

  const renderPDF = async (pdf, canvas, pageNumber) => {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const canvasContext = canvas.getContext('2d');
    
    // Calculate scale to fit the canvas
    const scaleX = canvas.width / viewport.width;
    const scaleY = canvas.height / viewport.height;
    const scale = Math.min(scaleX, scaleY);
    
    const scaledViewport = page.getViewport({ scale });

    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    const renderContext = {
      canvasContext,
      viewport: scaledViewport,
    };

    await page.render(renderContext);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setOriginalPdf(pdf);
      setCurrentPage(1);
      // Here you would send the PDF to your backend for processing
      // For now, we'll just set the same PDF as processed
      setProcessedPdf(pdf);
    }
  };

  const handlePageChange = (delta) => {
    setCurrentPage((prev) => {
      const newPage = prev + delta;
      return newPage > 0 && newPage <= (originalPdf?.numPages || 1) ? newPage : prev;
    });
  };

  const handleRerun = () => {
    setOriginalPdf(null);
    setProcessedPdf(null);
    setCurrentPage(1);
  };

  const handleSend = () => {
    console.log('Sending PDF to backend for processing...');
  };

  const handleApprove = () => {
    console.log('Saving processed PDF to database...');
  };

  const PageNavigation = ({ pdf }) => (
    <div className="flex justify-between items-center mb-2">
      <button onClick={() => handlePageChange(-1)} disabled={currentPage === 1} className="bg-gray-200 text-black px-2 py-1 rounded disabled:opacity-50">
        &lt;
      </button>
      <span>{currentPage} / {pdf?.numPages || 1}</span>
      <button onClick={() => handlePageChange(1)} disabled={!pdf || currentPage === pdf.numPages} className="bg-gray-200 text-black px-2 py-1 rounded disabled:opacity-50">
        &gt;
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-center p-4 bg-gradient-to-r from-blue-400 to-teal-400 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-white">Extract OCR</h1>
      <div className="flex justify-between w-full max-w-7xl bg-white rounded-lg shadow-lg p-6" style={{ height: '80vh' }}>
        <div className="w-[48%] flex flex-col">
          <h2 className="text-lg font-semibold mb-2">ORIGINAL DOCUMENT:</h2>
          <PageNavigation pdf={originalPdf} />
          <div className="bg-gray-100 p-2 rounded relative flex-grow overflow-hidden">
            {!originalPdf && (
              <div className="absolute inset-0 flex items-center justify-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded">
                  Upload PDF
                </label>
              </div>
            )}
            <canvas ref={originalCanvasRef} className="w-full h-full" />
          </div>
        </div>
        <div className="flex flex-col justify-center space-y-4">
          <button onClick={handleRerun} className="bg-gray-200 text-black p-2 rounded-full w-12 h-12 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button onClick={handleSend} className="bg-gray-200 text-black p-2 rounded-full w-12 h-12 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
          <button onClick={handleApprove} className="bg-green-500 text-white p-2 rounded-full w-12 h-12 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
        <div className="w-[48%] flex flex-col">
          <h2 className="text-lg font-semibold mb-2">EXTRACTED TEXT:</h2>
          <PageNavigation pdf={processedPdf} />
          <div className="bg-gray-100 p-2 rounded flex-grow overflow-hidden">
            <canvas ref={processedCanvasRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFComparison;