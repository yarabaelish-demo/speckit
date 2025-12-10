import React, { useEffect, useRef } from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  const currentPageButtonRef = useRef<HTMLButtonElement>(null);
  const previousPageRef = useRef<number>(currentPage);

  // Focus management: focus the current page button when page changes
  useEffect(() => {
    // Only focus if the page actually changed (not on initial render)
    if (previousPageRef.current !== currentPage && currentPageButtonRef.current) {
      currentPageButtonRef.current.focus();
    }
    previousPageRef.current = currentPage;
  }, [currentPage]);

  // Hide component when totalPages <= 1
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    
    // Show all pages if totalPages <= 7
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            ref={currentPage === i ? currentPageButtonRef : null}
            onClick={() => onPageChange(i)}
            aria-label={`Go to page ${i}`}
            aria-current={currentPage === i ? 'page' : undefined}
            style={{
              padding: '5px 10px',
              margin: '0 2px',
              border: '1px solid #ccc',
              borderRadius: '3px',
              cursor: 'pointer',
              backgroundColor: currentPage === i ? '#1976d2' : 'white',
              color: currentPage === i ? 'white' : 'black',
              fontWeight: currentPage === i ? 'bold' : 'normal'
            }}
          >
            {i}
          </button>
        );
      }
    } else {
      // Show first page
      pageNumbers.push(
        <button
          key={1}
          ref={currentPage === 1 ? currentPageButtonRef : null}
          onClick={() => onPageChange(1)}
          aria-label="Go to page 1"
          aria-current={currentPage === 1 ? 'page' : undefined}
          style={{
            padding: '5px 10px',
            margin: '0 2px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            cursor: 'pointer',
            backgroundColor: currentPage === 1 ? '#1976d2' : 'white',
            color: currentPage === 1 ? 'white' : 'black',
            fontWeight: currentPage === 1 ? 'bold' : 'normal'
          }}
        >
          1
        </button>
      );

      // Show ellipsis if needed
      if (currentPage > 3) {
        pageNumbers.push(<span key="ellipsis1" style={{ padding: '0 5px' }}>...</span>);
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <button
            key={i}
            ref={currentPage === i ? currentPageButtonRef : null}
            onClick={() => onPageChange(i)}
            aria-label={`Go to page ${i}`}
            aria-current={currentPage === i ? 'page' : undefined}
            style={{
              padding: '5px 10px',
              margin: '0 2px',
              border: '1px solid #ccc',
              borderRadius: '3px',
              cursor: 'pointer',
              backgroundColor: currentPage === i ? '#1976d2' : 'white',
              color: currentPage === i ? 'white' : 'black',
              fontWeight: currentPage === i ? 'bold' : 'normal'
            }}
          >
            {i}
          </button>
        );
      }

      // Show ellipsis if needed
      if (currentPage < totalPages - 2) {
        pageNumbers.push(<span key="ellipsis2" style={{ padding: '0 5px' }}>...</span>);
      }

      // Show last page
      pageNumbers.push(
        <button
          key={totalPages}
          ref={currentPage === totalPages ? currentPageButtonRef : null}
          onClick={() => onPageChange(totalPages)}
          aria-label={`Go to page ${totalPages}`}
          aria-current={currentPage === totalPages ? 'page' : undefined}
          style={{
            padding: '5px 10px',
            margin: '0 2px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            cursor: 'pointer',
            backgroundColor: currentPage === totalPages ? '#1976d2' : 'white',
            color: currentPage === totalPages ? 'white' : 'black',
            fontWeight: currentPage === totalPages ? 'bold' : 'normal'
          }}
        >
          {totalPages}
        </button>
      );
    }

    return pageNumbers;
  };

  return (
    <nav 
      aria-label="Pagination navigation"
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: '20px',
        gap: '10px'
      }}
    >
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
        aria-disabled={currentPage === 1}
        style={{
          padding: '5px 15px',
          border: '1px solid #ccc',
          borderRadius: '3px',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          backgroundColor: currentPage === 1 ? '#f0f0f0' : 'white',
          opacity: currentPage === 1 ? 0.5 : 1
        }}
      >
        Previous
      </button>
      
      {renderPageNumbers()}
      
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
        aria-disabled={currentPage === totalPages}
        style={{
          padding: '5px 15px',
          border: '1px solid #ccc',
          borderRadius: '3px',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          backgroundColor: currentPage === totalPages ? '#f0f0f0' : 'white',
          opacity: currentPage === totalPages ? 0.5 : 1
        }}
      >
        Next
      </button>
    </nav>
  );
};

export default PaginationControls;
