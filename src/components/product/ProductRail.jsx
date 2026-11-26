import { useId } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

/** Carrusel horizontal de productos con autoplay cada 3 s. */
export default function ProductRail({ title, kicker, products, categoryNames = {}, delay = 3000 }) {
  const id = useId().replace(/:/g, '');
  if (!products?.length) return null;

  return (
    <div className="rail">
      <div className="section-head">
        <div>
          {kicker && <span className="kicker">{kicker}</span>}
          <h2 className="section-title">{title}</h2>
        </div>
        <div className="rail-nav">
          <button type="button" className={`rail-prev-${id}`} aria-label="Anterior"><ChevronLeft /></button>
          <button type="button" className={`rail-next-${id}`} aria-label="Siguiente"><ChevronRight /></button>
        </div>
      </div>
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        spaceBetween={20}
        slidesPerView={1.25}
        loop={products.length > 4}
        autoplay={{ delay, disableOnInteraction: false, pauseOnMouseEnter: true }}
        navigation={{ prevEl: `.rail-prev-${id}`, nextEl: `.rail-next-${id}` }}
        pagination={{ clickable: true }}
        breakpoints={{ 576: { slidesPerView: 2.2 }, 900: { slidesPerView: 3 }, 1200: { slidesPerView: 4 } }}
        className="rail-swiper"
      >
        {products.map((p) => (
          <SwiperSlide key={p.id}>
            <ProductCard product={p} categoryName={categoryNames[p.categoryId]} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
