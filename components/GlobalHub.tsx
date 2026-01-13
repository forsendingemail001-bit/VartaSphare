
import React, { useState } from 'react';
import { MOCK_CLANS, MOCK_GLOBAL_ROOMS, Icons } from '../constants';
import { ChatRoom } from '../types';

interface GlobalHubProps {
  onJoinRoom: (room: ChatRoom) => void;
}

const GlobalHub: React.FC<GlobalHubProps> = ({ onJoinRoom }) => {
  const [filter, setFilter] = useState('trending');

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0c] custom-scrollbar p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900/40 to-slate-900 border border-slate-800 p-10 flex flex-col items-center text-center">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600 rounded-full blur-[100px]"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600 rounded-full blur-[100px]"></div>
          </div>
          
          <h1 className="text-4xl font-bold gaming-font mb-4 text-white">The Global Frontier</h1>
          <p className="text-slate-400 max-w-2xl mb-8">
            Connect with millions of players, creators, and enthusiasts across thousands of interest-based rooms. 
            Join a clan or forge your own legacy in VartaSphere.
          </p>
          
          <div className="flex space-x-4">
             <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">
               Discover Trending
             </button>
             <button className="px-6 py-3 bg-slate-800 text-slate-200 rounded-xl font-bold border border-slate-700 hover:bg-slate-700 transition-colors">
               Create Clan
             </button>
          </div>
        </div>

        {/* Categories / Filter */}
        <div className="flex justify-center space-x-6 border-b border-slate-800 pb-4">
          {['trending', 'gaming', 'tech', 'music', 'clans'].map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`capitalize px-4 py-2 text-sm font-semibold transition-all ${filter === cat ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Trending Rooms Grid */}
        <section>
          <h2 className="text-2xl font-bold gaming-font mb-6 flex items-center">
            <span className="mr-2">🔥</span> Trending Channels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_GLOBAL_ROOMS.map(room => (
              <div 
                key={room.id}
                className="group bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all cursor-pointer"
                onClick={() => onJoinRoom(room)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {room.icon}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span>1.2k Active</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{room.name}</h3>
                <p className="text-sm text-slate-400 mb-6 line-clamp-2">{room.description}</p>
                <button className="w-full py-2 bg-slate-800 hover:bg-blue-600 rounded-lg text-sm font-bold transition-colors">
                  Join Room
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Top Clans Section */}
        <section className="pb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gaming-font flex items-center">
              <span className="mr-2">🛡️</span> Top Clans
            </h2>
            <button className="text-blue-500 text-sm hover:underline">View Leaderboard</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {MOCK_CLANS.map(clan => (
              <div key={clan.id} className="relative group overflow-hidden rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-all">
                <img src={clan.banner} className="w-full h-32 object-cover" alt={clan.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent"></div>
                <div className="relative p-6 -mt-12 flex items-end justify-between">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-blue-600 border-4 border-[#0a0a0c] rounded-2xl flex items-center justify-center text-2xl font-bold gaming-font">
                      {clan.tag}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-white leading-tight">{clan.name}</h3>
                      <p className="text-xs text-slate-500">LVL {clan.level} • {clan.membersCount} Members</p>
                    </div>
                  </div>
                  <button className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500">
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default GlobalHub;
