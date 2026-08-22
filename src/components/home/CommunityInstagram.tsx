import React from 'react';
import { Instagram, Heart, ShoppingBag } from 'lucide-react';

interface CommunityInstagramProps {
  onNavigate: (page: string, param?: string) => void;
}

export const CommunityInstagram: React.FC<CommunityInstagramProps> = ({ onNavigate }) => {
  const posts = [
    {
      id: 'post-1',
      handle: '@lucas_streetwear',
      likes: '1.240',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
      item: 'T-Shirt Cyber Dystopia',
    },
    {
      id: 'post-2',
      handle: '@matheus_vision',
      likes: '980',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
      item: 'Hoodie Heavyweight 400g',
    },
    {
      id: 'post-3',
      handle: '@bruno_outfit',
      likes: '2.150',
      image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80',
      item: 'Puffer Stealth Tech',
    },
    {
      id: 'post-4',
      handle: '@felipe_cargo',
      likes: '1.430',
      image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
      item: 'Calça Cargo Ripstop',
    },
    {
      id: 'post-5',
      handle: '@gabriel_caps',
      likes: '890',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
      item: 'Boné 5 Panel Black',
    },
    {
      id: 'post-6',
      handle: '@thiago_kicks',
      likes: '3.120',
      image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80',
      item: 'Tênis Phantom Runner',
    },
  ];

  return (
    <section className="py-20 bg-[#161616] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#D6B35A] mb-2">
            <Instagram className="w-4 h-4" />
            <span>#AURAARCHIVE NA COMUNIDADE</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-[#EFECE6]">
            VEJA COMO A COMUNIDADE VESTE AURA
          </h2>
          <p className="text-xs text-[#777777] mt-2">
            Marque @aura.streetwear no Instagram ou use a hashtag #AURAARCHIVE para aparecer em nosso feed.
          </p>
        </div>

        {/* UGC Mosaic Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {posts.map((p) => (
            <div
              key={p.id}
              onClick={() => onNavigate('shop')}
              className="group relative aspect-square rounded-xl overflow-hidden border border-[#262626] hover:border-[#D6B35A] cursor-pointer bg-black transition-all"
            >
              <img
                src={p.image}
                alt={p.handle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between text-xs">
                <span className="font-bold text-[#D6B35A] text-[10px]">{p.handle}</span>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[#EFECE6] text-[10px]">
                    <Heart className="w-3 h-3 fill-current text-red-500" />
                    <span>{p.likes}</span>
                  </div>
                  <p className="text-[10px] text-[#EFECE6] font-extrabold line-clamp-1">{p.item}</p>
                </div>

                <span className="text-[9px] uppercase font-black bg-[#D6B35A] text-black px-2 py-1 rounded text-center">
                  COMPRAR O LOOK
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
