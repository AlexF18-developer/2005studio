import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { HERO_SLIDES } from '../../config/content';
import { STORE } from '../../config/store';
import { waConsulta } from '../../lib/whatsapp';

const DELAY = 3000;

export default function HeroCarousel() {
  return (
    <section className="hero" style={{ '--hero-delay': `${DELAY}ms` }}>
      <Swiper
        modules={[Autoplay, EffectFade, Navigation, Pagination]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={1100}
        loop
        autoplay={{ delay: DELAY, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        navigation
        className="hero-swiper"
      >
        {HERO_SLIDES.map((s, i) => (
          <SwiperSlide key={s.title}>
            <div className={`hero-slide ${s.product ? `hero-slide-product tone-${s.tone || 'ink'}` : ''}`}>
              {s.image && <div className="hero-bg" style={{ backgroundImage: `url(${s.image})` }} />}
              <div className="hero-overlay" />
              <div className="container hero-content">
                <span className="hero-kicker">{s.kicker}</span>
                {i === 0 ? <h1 className="hero-title">{s.title}</h1> : <h2 className="hero-title">{s.title}</h2>}
                <p className="hero-text">{s.text}</p>
                <div className="hero-actions">
                  <Link to={s.cta.to} className="btn btn-gold btn-lg btn-shine">
                    {s.cta.label} <ArrowRight size={18} />
                  </Link>
                  <a href={waConsulta()} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light btn-lg">
                    Pedir por WhatsApp
                  </a>
                </div>
              </div>
              {s.product && (
                <figure className="hero-product" aria-hidden="true">
                  <img src={s.product} alt="" loading={i === 1 ? 'eager' : 'lazy'} />
                </figure>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <div className="hero-brand" aria-hidden="true">{STORE.shortName}</div>
      <button type="button" className="hero-scroll" aria-label="Bajar" onClick={() => document.getElementById('beneficios')?.scrollIntoView({ behavior: 'smooth' })}><ChevronDown /></button>
    </section>
  );
}
