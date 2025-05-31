// app/supplier/[supplierId]/products/HeroCarousel.jsx
"use client";

import React, { useEffect } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

export default function HeroCarousel({ slides }) {
  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    slides: { perView: 1 },
  });

  // Reinitialize when slides change
  useEffect(() => {
    if (instanceRef.current) instanceRef.current.update();
  }, [slides]);

  if (!slides.length) return null;

  return (
    <div ref={sliderRef} className='keen-slider h-64 md:h-96 w-full mb-8'>
      {slides.map((url, idx) => (
        <div
          key={idx}
          className='keen-slider__slide bg-center bg-cover'
          style={{ backgroundImage: `url(${url})` }}
        />
      ))}
    </div>
  );
}
