import { Link } from 'react-router-dom';
import { LayoutDashboard, Monitor, ExternalLink } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="font-display text-6xl md:text-7xl font-black tracking-tight mb-4">
            NGDC HOUSE DRAFT
          </h1>
          <h2 className="font-display text-3xl md:text-4xl font-black text-grey-300 mb-8">
            2026
          </h2>
          <p className="text-xl text-grey-400 font-light max-w-2xl mx-auto">
            Real-time Game Jam Candidate Draft & Bidding
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Link to="/projector">
            <div className="card h-56 flex flex-col items-center justify-center text-center p-8 transition-all hover:border-white group cursor-pointer">
              <Monitor className="w-12 h-12 text-grey-400 group-hover:text-white mb-4 transition-colors" />
              <h3 className="font-display text-2xl font-bold mb-2">Projector View</h3>
              <p className="text-sm text-grey-500">
                Stage projection display with live bidding and artwork showcase
              </p>
            </div>
          </Link>

          <Link to="/admin">
            <div className="card h-56 flex flex-col items-center justify-center text-center p-8 transition-all hover:border-white group cursor-pointer">
              <LayoutDashboard className="w-12 h-12 text-grey-400 group-hover:text-white mb-4 transition-colors" />
              <h3 className="font-display text-2xl font-bold mb-2">Moderator Panel</h3>
              <p className="text-sm text-grey-500">
                Control bids, timer, candidate selection, and house budgets
              </p>
            </div>
          </Link>
        </div>

        <div className="border-t border-white/10 pt-12">
          <h3 className="font-display text-xl font-bold mb-6 text-center text-grey-300">
            Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="text-center">
              <kbd className="px-3 py-2 bg-black border border-white/20 rounded font-mono">Space</kbd>
              <p className="text-xs text-grey-500 mt-1">Timer</p>
            </div>
            <div className="text-center">
              <kbd className="px-3 py-2 bg-black border border-white/20 rounded font-mono">Enter</kbd>
              <p className="text-xs text-grey-500 mt-1">Confirm Sold</p>
            </div>
            <div className="text-center">
              <kbd className="px-3 py-2 bg-black border border-white/20 rounded font-mono">1–5</kbd>
              <p className="text-xs text-grey-500 mt-1">Select House</p>
            </div>
            <div className="text-center">
              <kbd className="px-3 py-2 bg-black border border-white/20 rounded font-mono">← →</kbd>
              <p className="text-xs text-grey-500 mt-1">Candidates</p>
            </div>
            <div className="text-center">
              <kbd className="px-3 py-2 bg-black border border-white/20 rounded font-mono">+1/+2/+5</kbd>
              <p className="text-xs text-grey-500 mt-1">Quick Bid</p>
            </div>
            <div className="text-center">
              <kbd className="px-3 py-2 bg-black border border-white/20 rounded font-mono">Space</kbd>
              <p className="text-xs text-grey-500 mt-1">Reveal Identity</p>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-sm text-grey-600 flex items-center justify-center gap-2">
            Built for NUST Game Development Club Orientation 2026
            <ExternalLink className="w-4 h-4" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;