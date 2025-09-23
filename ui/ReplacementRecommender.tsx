import React, { useState, useEffect, useMemo } from 'react';

// Foundation-Only Component - No network calls
const ReplacementRecommender: React.FC = () => {
  const [cards, setCards] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'SAFE' | 'SAVE' | 'INSTANT'>('ALL');
  const [total, setTotal] = useState(0);
  const [ragSuggestions, setRagSuggestions] = useState<string[]>([]);

  // Load cards from local storage (Foundation-Only)
  useEffect(() => {
    const mockCards = [
      { id: 'C001', category: 'SAFE', item: 'Server A', price: 5000000, qty: 2 },
      { id: 'C002', category: 'SAVE', item: 'Switch B', price: 2000000, qty: 5 },
      { id: 'C003', category: 'INSTANT', item: 'Cable C', price: 50000, qty: 100 }
    ];
    setCards(mockCards);

    // Mock RAG suggestions (Foundation-Only)
    setRagSuggestions(['Consider bulk pricing', 'Check warranty terms', 'Validate compatibility']);
  }, []);

  // Calculate real-time total
  const filteredCards = useMemo(() => {
    return filter === 'ALL' ? cards : cards.filter(c => c.category === filter);
  }, [cards, filter]);

  useEffect(() => {
    const sum = filteredCards.reduce((acc, card) => acc + (card.price * card.qty), 0);
    setTotal(sum);
  }, [filteredCards]);

  // Export handler (Foundation-Only - local download)
  const handleExport = () => {
    const data = JSON.stringify({ cards: filteredCards, total, timestamp: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'replacement_plan.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="recommender" role="main" aria-label="Replacement Recommender">
      <h1>Replacement Recommender (Foundation-Only)</h1>

      {/* Filter buttons - 44px min height for accessibility */}
      <div className="filters" role="group" aria-label="Category filters">
        {['ALL', 'SAFE', 'SAVE', 'INSTANT'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat as any)}
            className={filter === cat ? 'active' : ''}
            style={{ minHeight: '44px', minWidth: '44px', padding: '12px 20px' }}
            aria-pressed={filter === cat}
            aria-label={`Filter by ${cat}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards display */}
      <div className="cards-grid" role="list" aria-label="Replacement cards">
        {filteredCards.map(card => (
          <div key={card.id} className="card" role="listitem">
            <span className={`badge badge-${card.category.toLowerCase()}`}>{card.category}</span>
            <h3>{card.item}</h3>
            <p>₩{card.price.toLocaleString()} × {card.qty}</p>
            <p className="subtotal">₩{(card.price * card.qty).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Real-time total */}
      <div className="total-section" aria-live="polite" aria-atomic="true">
        <h2>Total: ₩{total.toLocaleString()}</h2>
      </div>

      {/* RAG Top-3 suggestions */}
      <div className="rag-suggestions" role="complementary" aria-label="AI suggestions">
        <h3>Top Suggestions:</h3>
        <ul>
          {ragSuggestions.map((suggestion, i) => (
            <li key={i}>{suggestion}</li>
          ))}
        </ul>
      </div>

      {/* Export button - 44px height */}
      <button
        onClick={handleExport}
        className="export-btn"
        style={{ minHeight: '44px', padding: '12px 24px' }}
        aria-label="Export replacement plan as JSON"
      >
        Export Plan
      </button>

      <style jsx>{`
        .recommender {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .filters {
          display: flex;
          gap: 10px;
          margin: 20px 0;
        }

        .filters button {
          background: #f0f0f0;
          border: 1px solid #ccc;
          cursor: pointer;
          font-size: 16px;
        }

        .filters button.active {
          background: #007bff;
          color: white;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .card {
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .badge-safe { background: #28a745; color: white; }
        .badge-save { background: #ffc107; color: black; }
        .badge-instant { background: #17a2b8; color: white; }

        .total-section {
          margin: 30px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          text-align: center;
        }

        .export-btn {
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
        }

        .export-btn:hover {
          background: #218838;
        }

        /* Ensure keyboard focus visibility */
        button:focus {
          outline: 2px solid #007bff;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default ReplacementRecommender;