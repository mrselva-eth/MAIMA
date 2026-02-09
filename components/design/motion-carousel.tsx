'use client';

import * as React from 'react';
import { motion, type Transition } from 'motion/react';
import type { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const transition: Transition = {
  type: 'spring',
  stiffness: 240,
  damping: 24,
  mass: 1,
};

type EmblaControls = {
  selectedIndex: number;
  scrollSnaps: number[];
  prevDisabled: boolean;
  nextDisabled: boolean;
  onDotClick: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

type DotButtonProps = {
  selected?: boolean;
  label: string;
  onClick: () => void;
};

function useEmblaControls(emblaApi: EmblaCarouselType | undefined): EmblaControls {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);
  const [prevDisabled, setPrevDisabled] = React.useState(true);
  const [nextDisabled, setNextDisabled] = React.useState(true);

  const onDotClick = React.useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);
  const onPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const onNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const updateSelectionState = (api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap());
    setPrevDisabled(!api.canScrollPrev());
    setNextDisabled(!api.canScrollNext());
  };

  const onInit = React.useCallback((api: EmblaCarouselType) => {
    setScrollSnaps(api.scrollSnapList());
    updateSelectionState(api);
  }, []);

  const onSelect = React.useCallback((api: EmblaCarouselType) => {
    updateSelectionState(api);
  }, []);

  React.useEffect(() => {
    if (!emblaApi) return;
    onInit(emblaApi);
    emblaApi.on('reInit', onInit).on('select', onSelect);
    return () => {
      emblaApi.off('reInit', onInit).off('select', onSelect);
    };
  }, [emblaApi, onInit, onSelect]);

  return {
    selectedIndex,
    scrollSnaps,
    prevDisabled,
    nextDisabled,
    onDotClick,
    onPrev,
    onNext,
  };
}

function DotButton({ selected = false, label, onClick }: DotButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      layout
      initial={false}
      className="flex cursor-pointer select-none items-center justify-center rounded-full border-none bg-[#1e40af] text-white transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e40af] focus-visible:ring-offset-2"
      animate={{
        width: selected ? 12 : 10,
        height: selected ? 12 : 10,
        opacity: selected ? 1 : 0.6,
      }}
      transition={transition}
    />
  );
}

export type MotionCarouselProps<T> = {
  items: readonly T[];
  options?: EmblaOptionsType;
  renderSlide: (item: T, index: number, isActive: boolean) => React.ReactNode;
  getSlideLabel?: (item: T, index: number) => string;
  /** Auto-advance interval in ms; 0 = off */
  autoplayInterval?: number;
};

const DEFAULT_AUTOPLAY_MS = 5000;

export function MotionCarousel<T>({
  items,
  options,
  renderSlide,
  getSlideLabel = (_, i) => `Slide ${i + 1}`,
  autoplayInterval = DEFAULT_AUTOPLAY_MS,
}: MotionCarouselProps<T>) {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const {
    selectedIndex,
    scrollSnaps,
    prevDisabled,
    nextDisabled,
    onDotClick,
    onPrev,
    onNext,
  } = useEmblaControls(emblaApi);

  // Loop autoplay: advance every N ms, 1 → 2 → … → 6 → 1
  React.useEffect(() => {
    if (!emblaApi || !autoplayInterval || autoplayInterval <= 0) return;
    const t = setInterval(() => emblaApi.scrollNext(), autoplayInterval);
    return () => clearInterval(t);
  }, [emblaApi, autoplayInterval]);

  return (
    <div className="w-full space-y-4 [--slide-height:12rem] sm:[--slide-height:16rem] md:[--slide-height:24rem] [--slide-spacing:0.5rem] [--slide-size:96%] sm:[--slide-size:97%]">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y touch-pinch-zoom">
          {items.map((item, index) => {
            const isActive = index === selectedIndex;
            return (
              <motion.div
                key={index}
                className="h-[var(--slide-height)] mr-[var(--slide-spacing)] basis-[var(--slide-size)] flex-none flex min-w-0"
              >
                <motion.div
                  className="size-full flex items-center justify-center select-none rounded-xl border-4 border-[#1e40af]/20 bg-white p-5 shadow-lg"
                  initial={false}
                  animate={{ scale: isActive ? 1 : 0.9 }}
                  transition={transition}
                >
                  {renderSlide(item, index, isActive)}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Button
          size="icon"
          variant="outline"
          onClick={onPrev}
          disabled={prevDisabled}
          className="rounded-full border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af] hover:text-white hover:border-[#1e40af] transition-colors"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div className="flex flex-wrap justify-end items-center gap-2">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              label={getSlideLabel(items[index], index)}
              selected={index === selectedIndex}
              onClick={() => onDotClick(index)}
            />
          ))}
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={onNext}
          disabled={nextDisabled}
          className="rounded-full border-[#1e40af]/40 text-[#1e40af] hover:bg-[#1e40af] hover:text-white hover:border-[#1e40af] transition-colors"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>
    </div>
  );
}
